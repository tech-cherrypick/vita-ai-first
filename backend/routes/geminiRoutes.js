const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');

router.post('/generate', geminiController.generateContent);

module.exports = router;
