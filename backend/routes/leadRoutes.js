const express = require('express');
const { createLead, getAllLeads } = require('../controllers/leadController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route for form submission
router.post('/leads', createLead);

// Admin route for fetching leads
router.get('/admin/leads', verifyToken, verifyAdmin, getAllLeads);

module.exports = router;
