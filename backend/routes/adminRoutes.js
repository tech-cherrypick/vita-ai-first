const express = require('express');
const multer = require('multer');
const { getAllRoles, setUserRole } = require('../controllers/adminController');
const { listDocuments, uploadDocument, deleteDocument } = require('../controllers/ragController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/roles', verifyToken, verifyAdmin, getAllRoles);
router.post('/set-role', verifyToken, verifyAdmin, setUserRole);

// RAG Document Management
router.get('/rag-docs', verifyToken, verifyAdmin, listDocuments);
router.post('/rag-docs', verifyToken, verifyAdmin, upload.single('file'), uploadDocument);
router.delete('/rag-docs/:id', verifyToken, verifyAdmin, deleteDocument);

module.exports = router;

