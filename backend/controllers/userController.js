const { admin } = require('../config/firebaseAdmin');
const { getUserRole } = require('../middleware/authMiddleware');

const db = admin.firestore();

const getRole = async (req, res) => {
  const role = await getUserRole(req.user.email);
  res.status(200).json({ role });
};

const syncData = async (req, res) => {
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
};

const getData = async (req, res) => {
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
};

module.exports = { getRole, syncData, getData };
