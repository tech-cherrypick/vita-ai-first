const express = require('express');
const { getAllRoles, setUserRole } = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/roles', verifyToken, verifyAdmin, getAllRoles);
router.post('/set-role', verifyToken, verifyAdmin, setUserRole);

module.exports = router;
