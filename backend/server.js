const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebaseAdmin');

// Initialize Firebase
initializeFirebase();
const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust as needed for production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '11mb' }));
app.use(express.urlencoded({ limit: '11mb', extended: true }));

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('join_room', (patientUid) => {
    const roomName = `room_${patientUid}`;
    socket.join(roomName);
    console.log(`👤 User joined room: ${roomName}`);
  });
  socket.on('send_message', async (data) => {
    const { patientUid, text, senderName, senderRole, avatar } = data;

    if (!patientUid || !text) return;

    try {
      const role = senderRole || data.sender;
      const messageData = {
        patientId: patientUid,
        sender: role,
        senderName,
        role: role === 'careCoordinator' ? 'Care Coordinator' : (role === 'doctor' ? 'Physician' : 'Patient'),
        text,
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
    } catch (err) {
      console.error('❌ Error sending message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

app.use('/api/user', userRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).send('🚀 Vita AI Backend is running with WebSockets!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
