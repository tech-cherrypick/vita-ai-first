const { admin } = require('../config/firebaseAdmin');
const db = admin.firestore();

const getAllRoles = async (req, res) => {
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
};

const setUserRole = async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).send('Missing email or role');

  try {
    await db.collection('roles').doc(email).set({ role, updated_at: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = { getAllRoles, setUserRole };
