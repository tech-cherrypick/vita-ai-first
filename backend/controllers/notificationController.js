const { admin } = require('../config/firebaseAdmin');

const db = admin.firestore();
const COLLECTION = 'user_notification_settings';

const updateNotificationSettings = async (req, res) => {
  const { fcm_token, enabled } = req.body;
  const userId = req.user.uid;

  if (!fcm_token || typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'fcm_token and enabled (boolean) are required' });
  }

  try {
    await db.collection(COLLECTION).doc(fcm_token).set({
      fcm_token,
      user_id: userId,
      enabled,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.status(200).json({ status: 'success', fcm_token, enabled });
  } catch (error) {
    console.error('Error updating notification settings:', error.message);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
};

const getNotificationSettings = async (req, res) => {
  const { fcm_token } = req.query;
  const userId = req.user.uid;

  if (!fcm_token) {
    return res.status(200).json({ exists: false, enabled: false });
  }

  try {
    const doc = await db.collection(COLLECTION).doc(fcm_token).get();

    if (!doc.exists) {
      return res.status(200).json({ exists: false, enabled: false });
    }

    const data = doc.data();
    if (data.user_id !== userId) {
      return res.status(200).json({ exists: false, enabled: false });
    }

    res.status(200).json({ exists: true, enabled: data.enabled, fcm_token: data.fcm_token });
  } catch (error) {
    console.error('Error fetching notification settings:', error.message);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
};

const sendTestNotification = async (req, res) => {
  const { user_id, title, body, imageUrl, patientUid } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    await sendNotificationToUser(
      user_id,
      title || 'Vita+ Test Notification',
      body || 'This is a test notification from Vita+',
      { imageUrl: imageUrl || '', patientUid: patientUid || '' }
    );

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error sending test notification:', error.message);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

const sendNotificationToUser = async (userId, title, body, { imageUrl, patientUid } = {}) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('user_id', '==', userId)
      .where('enabled', '==', true)
      .get();

    if (snapshot.empty) return;

    const tokens = snapshot.docs.map(doc => doc.data().fcm_token);

    for (const token of tokens) {
      try {
        const data = { title, body };
        if (imageUrl) data.imageUrl = imageUrl;
        if (patientUid) data.patientUid = patientUid;

        await admin.messaging().send({
          data,
          token,
          android: { priority: 'high' }
        });
      } catch {
      }
    }
  } catch {
  }
};

module.exports = { updateNotificationSettings, getNotificationSettings, sendTestNotification, sendNotificationToUser };

