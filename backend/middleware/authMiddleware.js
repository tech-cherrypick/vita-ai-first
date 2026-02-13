const { admin } = require('../config/firebaseAdmin');

// Helper: Get user role
const getUserRole = async (email) => {
  const db = admin.firestore();
  console.log(`🔍 Checking role for: ${email}`);
  if (email === 'tech@cherrypick.live') {
    console.log('✨ Recognized Hardcoded Admin');
    return 'admin';
  }
  
  try {
    const roleDoc = await db.collection('roles').doc(email).get();
    if (roleDoc.exists) {
      const role = roleDoc.data().role;
      console.log(`📄 Found Firestore role: ${role}`);
      return role;
    } else {
      console.log('❓ No role found in Firestore, defaulting to patient');
    }
  } catch (error) {
    console.error('❌ Error fetching role from Firestore:', error.message);
  }
  return 'patient'; // Default role
};

// Auth Middleware
const verifyToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    console.log(`✅ Token verified for: ${decodedToken.email}`);
    next();
  } catch (error) {
    console.error('❌ Auth Error:', error.message);
    res.status(401).send('Unauthorized: Invalid token');
  }
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

module.exports = { verifyToken, verifyAdmin, getUserRole };
