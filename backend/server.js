const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { initializeFirebase, admin } = require('./config/firebaseAdmin');


const app = express();

// CORS Configuration
const allowedOrigins = [
  'https://vita-ai-first-3b03doby6-cherry-picks-projects-29b8b9cc.vercel.app',
  'https://vita-ai-first.vercel.app', // Add your production Vercel domain
  'http://localhost:3000',
  'http://localhost:19006', // Expo web
  'http://localhost:8081'   // React Native
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize Firebase Admin 
const serviceAccountPath = './service-account.json';
const fs = require('fs');

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'vita-479105'
    });
    console.log('✅ Firebase Admin Initialized using FIREBASE_SERVICE_ACCOUNT_JSON env var');
  } else if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
      projectId: 'vita-479105'
    });
    console.log('✅ Firebase Admin Initialized using service-account.json');
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'vita-479105'
    });
    console.log('✅ Firebase Admin Initialized using GCloud CLI (ADC)');
  }
} catch (error) {
  console.error('❌ Firebase Admin Init Error:', error.message);
  console.log('⚠️ To fix this, either:');
  console.log('   1. Run: gcloud auth application-default login');
  console.log('   2. Add backend/service-account.json from Firebase Console');
}

// Initialize Firebase
initializeFirebase();
const db = admin.firestore();
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
