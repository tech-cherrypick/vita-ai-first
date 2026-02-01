const express = require('express');
const { getAllPatients } = require('../controllers/doctorController');
// potentially add verifyDoctor middleware if we want to restrict this
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/patients', verifyToken, getAllPatients);

module.exports = router;
