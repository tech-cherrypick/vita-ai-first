const express = require('express');
const { getUnreadCounts, markAsRead } = require('../controllers/messageTrackingController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/unread', verifyToken, getUnreadCounts);
router.post('/mark-read', verifyToken, markAsRead);

module.exports = router;

