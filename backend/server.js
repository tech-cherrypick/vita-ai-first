const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin 
// Using Application Default Credentials (ADC) from GCloud CLI
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'vita-479105' // Your Firebase Project ID
  });
  console.log('✅ Firebase Admin Initialized using GCloud CLI');
} catch (error) {
  console.error('❌ Firebase Admin Init Error:', error.message);
  console.log('⚠️ Ensure you have run: gcloud auth application-default login');
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

// Sync Endpoint
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
    if (error.stack) console.error(error.stack);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
