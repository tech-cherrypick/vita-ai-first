const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeFirebase } = require('./config/firebaseAdmin');

// Initialize Firebase
initializeFirebase();

const app = express();
app.use(cors());
app.use(express.json({ limit: '11mb' }));
app.use(express.urlencoded({ limit: '11mb', extended: true }));

// Routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

// Use Routes - Note: structure adjusted to match original paths where possible, or logical grouping
// Original: /api/user/role -> mapped to userRoutes
// Original: /api/sync -> mapped to userRoutes (conceptually 'user data')
// Original: /api/data -> mapped to userRoutes

// We can map them specifically to keep API structure:
app.use('/api/user', userRoutes); // serves /api/user/role
app.use('/api', userRoutes);      // serves /api/sync, /api/data (Note: sync and data are in root /api in original?)
// Wait, original: /api/sync and /api/data. 
// If I mount userRoutes at /api/user, it becomes /api/user/sync. 
// To preserve /api/sync, I need to mount at /api or adjust userRoutes.
// Let's adjust userRoutes to just handle specific paths if we want to preserve exact URL structure, 
// OR we can change frontend. Changing frontend effectively is better long term but might break things now.
// Let's look at userRoutes again.
// router.get('/role') -> /api/user/role (if mounted at /api/user)
// router.post('/sync') -> /api/user/sync (if mounted at /api/user)

// To keep original paths:
// /api/user/role -> Mount a router for /api/user
// /api/sync -> Mount a router for /api
// /api/data -> Mount a router for /api

// Use specific mounts for now to match exactly or create composite routers.
// Easiest: Mount everything under /api and define full paths in routes? 
// Or better, just breaking changes:
// Let's try to match:
app.use('/api/user', userRoutes); // serves /api/user/role
app.use('/api', userRoutes); // serves /api/sync (from router.post('/sync')) and /api/data

// Admin
// Original: /api/admin/roles -> adminRoutes
app.use('/api/admin', adminRoutes);

// Doctor
app.use('/api/doctor', doctorRoutes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).send('🚀 Vita AI Backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
