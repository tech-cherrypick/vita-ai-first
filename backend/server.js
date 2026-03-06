const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { initializeFirebase, admin } = require('./config/firebaseAdmin');


const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

app.use(express.json({ limit: '11mb' }));
app.use(express.urlencoded({ limit: '11mb', extended: true }));

// Initialize Firebase Admin
initializeFirebase();
const { sendNotificationToUser } = require('./controllers/notificationController');
const db = admin.firestore();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust as needed for production
    methods: ["GET", "POST"]
  }
});


// Socket.io Logic
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('join_room', (patientUid) => {
    const roomName = `room_${patientUid}`;
    socket.join(roomName);
    console.log(`👤 User joined room: ${roomName}`);
  });

  socket.on('join_call_room', (data) => {
    const { patientId, role, isRemoteStreamAdded } = data;
    const roomName = `call_room_${patientId}`;
    socket.join(roomName);
    console.log(`🎥 ${role} joined call room: ${roomName}`);
    
    // Notify others in the room
    socket.to(roomName).emit('user_joined_call', { role });

    // Inform the newly joined user if someone is already in the room
    const clients = io.sockets.adapter.rooms.get(roomName);
    if (clients && clients.size > 1) {
       const otherRole = role === 'doctor' ? 'patient' : 'doctor';
       socket.emit('user_joined_call', { role: otherRole });
    }
  });

  socket.on('leave_call_room', (data) => {
    const { patientId, role } = data;
    const roomName = `call_room_${patientId}`;
    socket.leave(roomName);
    console.log(`👋 ${role} left call room: ${roomName}`);
    socket.to(roomName).emit('user_left_call', { role });
  });

  // WebRTC Signaling
  socket.on('webrtc_signal', (data) => {
    const { patientId, signalData, role } = data;
    const roomName = `call_room_${patientId}`;
    // Forward the signal to the other peer in the room
    socket.to(roomName).emit('webrtc_signal', { signalData, role });
  });

  // Media Status (Muted/Video Off)
  socket.on('media_status_changed', (data) => {
    const { patientId, role, isMuted, isVideoOff } = data;
    const roomName = `call_room_${patientId}`;
    socket.to(roomName).emit('media_status_changed', { role, isMuted, isVideoOff });
  });

  // Speaking Status
  socket.on('speaking_status_changed', (data) => {
    const { patientId, role, isSpeaking } = data;
    const roomName = `call_room_${patientId}`;
    socket.to(roomName).emit('speaking_status_changed', { role, isSpeaking });
  });

  socket.on('send_message', async (data) => {
    const { patientUid, text, senderName, senderRole, avatar } = data;

    if (!patientUid || (!text && !data.attachment)) return;

    try {
      const role = senderRole || data.sender;
      const messageData = {
        patientId: patientUid,
        sender: role,
        senderName,
        role: role === 'careCoordinator' ? 'Care Coordinator' : (role === 'doctor' ? 'Physician' : 'Patient'),
        text,
        attachment: data.attachment || null,
        avatar,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      // 1. Persistence to Firestore
      const msgRef = await db.collection('users').doc(patientUid).collection('messages').add(messageData);
      
      // 2. Broadcast to room
      const broadcastData = {
        ...messageData,
        id: msgRef.id,
        timestamp: new Date().toISOString() // Fallback string for real-time
      };

      io.to(`room_${patientUid}`).emit('receive_message', broadcastData);
      console.log(`📩 Message sent in room_${patientUid} by ${senderName}`);

      try {
        const senderId = data.senderId || null;
        const recipientIds = new Set();

        recipientIds.add(patientUid);

        const rolesSnapshot = await db.collection('roles')
          .where('role', 'in', ['doctor', 'careCoordinator'])
          .get();

        for (const roleDoc of rolesSnapshot.docs) {
          const email = roleDoc.id;
          try {
            const userRecord = await admin.auth().getUserByEmail(email);
            recipientIds.add(userRecord.uid);
          } catch {
          }
        }

        if (senderId) {
          recipientIds.delete(senderId);
        }

        const notificationTitle = `${senderName}`;
        const notificationBody = text || 'Sent an attachment';

        for (const recipientId of recipientIds) {
          sendNotificationToUser(recipientId, notificationTitle, notificationBody, {
            imageUrl: avatar || '',
            patientUid
          });
        }
      } catch {
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
    }
  });

  // Call Signaling Logic
  socket.on('initiate_call', (data) => {
    const { patientId, doctorName, doctorId } = data;
    console.log(`📞 Call initiated for patient ${patientId} by doctor ${doctorName}`);
    io.to(`room_${patientId}`).emit('incoming_call', { doctorName, doctorId, patientId });
  });

  socket.on('accept_call', (data) => {
    const { patientId, patientName } = data;
    console.log(`✅ Call accepted by patient ${patientName} (${patientId})`);
    io.to(`room_${patientId}`).emit('call_accepted', { patientName, patientId });
  });

  socket.on('end_call', (data) => {
    const { patientId, senderRole } = data;
    console.log(`🛑 Call ended by ${senderRole} for patient ${patientId}`);
    io.to(`room_${patientId}`).emit('call_ended', { patientId, senderRole });
  });

  socket.on('signal', (data) => {
    const { patientId, signalData, senderRole } = data;
    // Relay WebRTC signaling data (offer, answer, candidates) to the other party in the room
    socket.to(`room_${patientId}`).emit('signal', { signalData, senderRole });
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const leadRoutes = require('./routes/leadRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/user', userRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/consultation', consultationRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api', leadRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).send('🚀 Vita AI Backend is running with WebSockets!');
});

// Serve static files from the frontend build
const distPath = path.resolve(__dirname, '../dist');
console.log('📂 Static files path (resolved):', distPath);

if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  console.log('✅ Static directory found. Contents:', files);
  
  // Serve files from dist root
  app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
} else {
  console.error('❌ CRITICAL: Static directory NOT found at:', distPath);
  try {
    const parentDir = path.resolve(__dirname, '..');
    console.log('📂 Parent directory contents:', fs.readdirSync(parentDir));
  } catch (e) {
    console.error('❌ Failed to read parent directory:', e.message);
  }
}

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  // Only serve index.html if it's not a request for an asset-like path
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    console.log(`⚠️ Asset not found: ${req.path}`);
    return res.status(404).send('Asset not found');
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Frontend build (index.html) missing');
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server starting...`);
  console.log(`📡 Attempting to listen on port: ${PORT}`);
  console.log(`🌍 URL: http://0.0.0.0:${PORT}`);
});
