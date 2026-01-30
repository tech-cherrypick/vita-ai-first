const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
app.use(cors());
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

const db = admin.firestore();

// Auth Middleware
const verifyToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    res.status(401).send('Unauthorized: Invalid token');
  }
};

// Helper: Get user role
const getUserRole = async (email) => {
  if (email === 'tech@cherrypick.live') return 'admin';
  
  try {
    const roleDoc = await db.collection('roles').doc(email).get();
    if (roleDoc.exists) {
      return roleDoc.data().role;
    }
  } catch (error) {
    console.error('Error fetching role:', error.message);
  }
  return 'patient'; // Default role
};

// Admin Middleware
const verifyAdmin = async (req, res, next) => {
  if (req.user.email === 'tech@cherrypick.live') {
    return next();
  }
  
  const role = await getUserRole(req.user.email);
  if (role === 'admin') {
    next();
  } else {
    res.status(403).send('Forbidden: Admin access required');
  }
};

// Get Current User Role (GET)
app.get('/api/user/role', verifyToken, async (req, res) => {
  const role = await getUserRole(req.user.email);
  res.status(200).json({ role });
});

// Sync Endpoint (POST)
app.post('/api/sync', verifyToken, async (req, res) => {
  const { section, data } = req.body;
  const uid = req.user.uid;

  if (!section || !data) {
    return res.status(400).send('Missing section or data');
  }

  try {
    const docRef = db.collection('users').doc(uid).collection('data').doc(section);
    await docRef.set({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`📡 Synced ${section} for user ${uid}`);
    res.status(200).json({ status: 'success', message: `Synced ${section}` });
  } catch (error) {
    console.error('❌ Firestore Sync Error:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

// Fetch All Data Endpoint (GET)
app.get('/api/data', verifyToken, async (req, res) => {
  const uid = req.user.uid;

  try {
    const snapshot = await db.collection('users').doc(uid).collection('data').get();
    const data = {};
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    
    console.log(`📥 Fetched data for user ${uid}`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Firestore Fetch Error:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

// Admin: List all roles (GET)
app.get('/api/admin/roles', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('roles').get();
    const roles = [];
    snapshot.forEach(doc => {
      roles.push({ email: doc.id, ...doc.data() });
    });
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Admin: Set role for an email (POST)
app.post('/api/admin/set-role', verifyToken, verifyAdmin, async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).send('Missing email or role');

  try {
    await db.collection('roles').doc(email).set({ role, updated_at: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
