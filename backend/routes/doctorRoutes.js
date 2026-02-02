const express = require('express');
const { getAllPatients } = require('../controllers/doctorController');
// potentially add verifyDoctor middleware if we want to restrict this
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/patients', verifyToken, getAllPatients);
router.post('/update-patient', verifyToken, require('../controllers/doctorController').updatePatientData);

module.exports = router;
