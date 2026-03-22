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
const { incrementUnread } = require('./controllers/messageTrackingController');
const db = admin.firestore();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  pingInterval: 25000,
  pingTimeout: 60000,
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
        senderId: data.senderId || null,
        timestamp: new Date().toISOString()
      };

      io.to(`room_${patientUid}`).emit('receive_message', broadcastData);
      console.log(`📩 Message sent in room_${patientUid} by ${senderName}`);

      if (role === 'patient') {
        incrementUnread(patientUid, data.senderId || null);
      }

      try {
        const senderId = data.senderId || null;
        const recipientIds = new Set();

        recipientIds.add(patientUid);

        const assignmentsSnapshot = await db.collection('patient_directory')
          .where('patient_id', '==', patientUid)
          .get();

        assignmentsSnapshot.forEach(doc => {
          recipientIds.add(doc.data().assigned_id);
        });

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

  socket.on('initiate_call', async (data) => {
    const { patientId, doctorName, doctorId } = data;
    console.log(`📞 Call initiated for patient ${patientId} by doctor ${doctorName}`);
    io.to(`room_${patientId}`).emit('incoming_call', { doctorName, doctorId, patientId });

    try {
      await sendNotificationToUser(
        patientId,
        'Incoming Video Call',
        `${doctorName} is calling you for a consultation`,
        { type: 'incoming_call', doctorName, doctorId, patientUid: patientId }
      );
    } catch (err) {
      console.error('❌ Failed to send call notification:', err);
    }
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

  // Gemini Live Proxy logic
  socket.on('geminiProxy_connect', async (config) => {
    const model = config.model || 'gemini-2.0-flash-exp';
    const patientId = config.patientId; // Optional patient ID for personalized context
    
    console.log(`📡 [GeminiProxy] Client request for connection:`, model, patientId ? `for patient ${patientId}` : '');
    
    try {
      const { GoogleGenAI } = require('@google/genai');
      const { getPatientContext } = require('./controllers/geminiController');
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let liveConfig = { ...config.config };

      // Inject patient context into systemInstruction if available
      if (patientId) {
          const patientContext = await getPatientContext(patientId);
          if (patientContext) {
              const originalInstruction = liveConfig.systemInstruction?.parts?.[0]?.text || '';
              liveConfig.systemInstruction = {
                  parts: [{
                      text: `${originalInstruction}\n\n${patientContext}`
                  }]
              };
              console.log(`👤 [GeminiProxy] Personalized context injected for patient ${patientId}`);
          }
      }

      // Use the live client from @google/genai
      const liveClient = await genAI.live.connect({
        model: model,
        config: liveConfig,
        callbacks: {
          onopen: () => {
            console.log('✅ [GeminiProxy] Connected to Google Gemini');
            socket.emit('geminiProxy_open');
          },
          onmessage: (msg) => {
            socket.emit('geminiProxy_message', msg);
          },
          onclose: () => {
            console.log('🔌 [GeminiProxy] Google Gemini connection closed');
            socket.emit('geminiProxy_close');
          },
          onerror: (err) => {
            console.error('❌ [GeminiProxy] Google Gemini error:', err);
            socket.emit('geminiProxy_error', { message: err.message });
          }
        }
      });

      socket.geminiSession = liveClient;

      socket.on('geminiProxy_input', (input) => {
        if (socket.geminiSession) {
          socket.geminiSession.sendRealtimeInput(input);
        }
      });

      socket.on('geminiProxy_toolResponse', (response) => {
        if (socket.geminiSession) {
          socket.geminiSession.sendToolResponse(response);
        }
      });

    } catch (err) {
      console.error('❌ [GeminiProxy] Setup error:', err);
      socket.emit('geminiProxy_error', { message: err.message });
    }
  });

  socket.on('geminiProxy_end', () => {
    if (socket.geminiSession) {
      console.log('🔌 [GeminiProxy] Ending session');
      socket.geminiSession.close();
      socket.geminiSession = null;
    }
  });

  socket.on('disconnect', () => {
    if (socket.geminiSession) {
      socket.geminiSession.close();
    }
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
const geminiRoutes = require('./routes/geminiRoutes');

app.use('/api/user', userRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/consultation', consultationRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/messages', require('./routes/messageTrackingRoutes'));
app.use('/api', leadRoutes);
app.use('/api/config', require('./routes/configRoutes'));
app.use('/api/patient-directory', require('./routes/patientDirectoryRoutes'));
app.use('/api/gemini', geminiRoutes);

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

const ragService = require('./services/ragService');
ragService.initialize().catch(err => console.error('Failed to initialize RAG:', err));

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server starting...`);
  console.log(`📡 Attempting to listen on port: ${PORT}`);
  console.log(`🌍 URL: http://0.0.0.0:${PORT}`);
});
