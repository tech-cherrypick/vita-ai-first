const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/generate', verifyToken, geminiController.generateContent);

module.exports = router;
