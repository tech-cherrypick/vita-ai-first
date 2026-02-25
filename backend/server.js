const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { initializeFirebase, admin } = require('./config/firebaseAdmin');


const app = express();

// CORS Configuration
const allowedOrigins = [
  /^https:\/\/vita-ai-first.*\.vercel\.app$/,  // Matches ALL Vercel preview URLs
  'https://vita-ai-first.vercel.app',          // Production Vercel domain
  'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:19006',                     // Expo web
  'http://localhost:8081'                       // React Native
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any pattern (string or regex)
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });
    
    if (isAllowed) {
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

app.use(express.json({ limit: '11mb' }));
app.use(express.urlencoded({ limit: '11mb', extended: true }));

// Initialize Firebase Admin
initializeFirebase();
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
const leadRoutes = require('./routes/leadRoutes');

app.use('/api/user', userRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/payment', require('./routes/paymentRoutes'));
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
