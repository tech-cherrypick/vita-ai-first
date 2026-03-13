const { admin } = require('../config/firebaseAdmin');

const db = admin.firestore();
const COLLECTION = 'user_message_tracking';

const getUnreadCounts = async (req, res) => {
  const readerUid = req.user.uid;

  try {
    const snapshot = await db.collection(COLLECTION)
      .where('reader_id', '==', readerUid)
      .where('unread_count', '>', 0)
      .get();

    const unreadMap = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      unreadMap[data.patient_id] = data.unread_count;
    });

    res.status(200).json(unreadMap);
  } catch (error) {
    console.error('Error fetching unread counts:', error.message);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
};

const markAsRead = async (req, res) => {
  const readerUid = req.user.uid;
  const { patient_id } = req.body;

  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id is required' });
  }

  const docId = `${readerUid}_${patient_id}`;

  try {
    await db.collection(COLLECTION).doc(docId).set({
      reader_id: readerUid,
      patient_id,
      unread_count: 0,
      last_read_timestamp: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error marking as read:', error.message);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

const incrementUnread = async (patientUid, senderUid) => {
  console.log(`🔔 [incrementUnread] Called with patientUid=${patientUid}, senderUid=${senderUid}`);
  try {
    const rolesSnapshot = await db.collection('roles')
      .where('role', 'in', ['doctor', 'careCoordinator'])
      .get();

    console.log(`🔔 [incrementUnread] Found ${rolesSnapshot.size} doctor/careCoordinator roles`);

    const readerUids = [];
    for (const roleDoc of rolesSnapshot.docs) {
      console.log(`🔔 [incrementUnread] Processing role doc: ${roleDoc.id} -> ${roleDoc.data().role}`);
      try {
        const userRecord = await admin.auth().getUserByEmail(roleDoc.id);
        if (userRecord.uid !== senderUid) {
          readerUids.push(userRecord.uid);
          console.log(`🔔 [incrementUnread] Added reader: ${userRecord.uid} (${roleDoc.id})`);
        }
      } catch (emailErr) {
        console.error(`🔔 [incrementUnread] Failed to get user by email ${roleDoc.id}:`, emailErr.message);
      }
    }

    console.log(`🔔 [incrementUnread] Total readers to update: ${readerUids.length}`);

    if (readerUids.length === 0) return;

    const batch = db.batch();
    for (const readerUid of readerUids) {
      const docId = `${readerUid}_${patientUid}`;
      const docRef = db.collection(COLLECTION).doc(docId);
      batch.set(docRef, {
        reader_id: readerUid,
        patient_id: patientUid,
        unread_count: admin.firestore.FieldValue.increment(1),
        last_message_timestamp: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`🔔 [incrementUnread] Queued write for doc: ${docId}`);
    }

    await batch.commit();
    console.log(`🔔 [incrementUnread] Batch committed successfully`);
  } catch (error) {
    console.error('🔔 [incrementUnread] Error:', error.message);
  }
};

module.exports = { getUnreadCounts, markAsRead, incrementUnread };

