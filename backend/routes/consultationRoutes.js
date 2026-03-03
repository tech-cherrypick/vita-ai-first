const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
// Assume some auth middleware exists if needed, for now we keep it simple as per project style

router.post('/save-transcript', consultationController.saveTranscriptAndSummary);
router.get('/:patientId/:consultationId', consultationController.getConsultationDetails);

module.exports = router;
