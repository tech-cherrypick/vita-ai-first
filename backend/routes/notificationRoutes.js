const express = require('express');
const { updateNotificationSettings, getNotificationSettings, sendTestNotification } = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/settings', verifyToken, updateNotificationSettings);
router.get('/settings', verifyToken, getNotificationSettings);
router.post('/test-send', verifyToken, sendTestNotification);

module.exports = router;

