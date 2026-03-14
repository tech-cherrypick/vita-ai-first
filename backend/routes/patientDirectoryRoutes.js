const express = require('express');
const { getPatientDirectory, assignDoctor, assignCareManager } = require('../controllers/patientDirectoryController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, verifyAdmin, getPatientDirectory);
router.put('/assign-doctor', verifyToken, verifyAdmin, assignDoctor);
router.put('/assign-care-manager', verifyToken, verifyAdmin, assignCareManager);

module.exports = router;

