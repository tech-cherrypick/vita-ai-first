const { admin } = require('../config/firebaseAdmin');
const db = admin.firestore();

const createLead = async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).send('Missing name, email, or phone');
  }

  try {
    await db.collection('leads').add({
      name,
      email,
      phone,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).send(error.message);
  }
};

const getAllLeads = async (req, res) => {
  try {
    const snapshot = await db.collection('leads').orderBy('timestamp', 'desc').get();
    const leads = [];
    snapshot.forEach(doc => {
      leads.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).send(error.message);
  }
};

module.exports = { createLead, getAllLeads };
