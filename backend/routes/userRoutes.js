const express = require('express');
const { getRole, syncData, getData, getMessages } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/role', verifyToken, getRole);
router.post('/sync', verifyToken, syncData);
router.get('/data', verifyToken, getData);
router.get('/messages', verifyToken, getMessages); // Add this
router.get('/ping', (req, res) => {
  res.status(200).send('Pong!');
});

module.exports = router;
