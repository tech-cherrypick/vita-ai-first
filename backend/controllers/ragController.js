const { admin } = require('../config/firebaseAdmin');
const db = admin.firestore();
const bucket = admin.storage().bucket();
const ragService = require('../services/ragService');
const pdf = require('pdf-parse');
const path = require('path');
const fs = require('fs-extra');

const listDocuments = async (req, res) => {
    try {
        const snapshot = await db.collection('rag_documents').orderBy('updatedAt', 'desc').get();
        const docs = [];
        snapshot.forEach(doc => {
            docs.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json(docs);
    } catch (error) {
        console.error('Error listing RAG docs:', error);
        res.status(500).send(error.message);
    }
};

const uploadDocument = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const { originalname, buffer, mimetype, size } = req.file;
        const fileName = originalname;
        
        // 1. Extract text from PDF
        let text = '';
        if (mimetype === 'application/pdf') {
            const data = await pdf(buffer);
            text = data.text || '';
        } else {
            text = buffer.toString('utf8');
        }

        if (!text.trim()) {
            return res.status(400).send('Could not extract text from the file.');
        }

        // 2. Upload to Firebase Storage
        const blob = bucket.file(`rag_pdfs/${Date.now()}_${fileName}`);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: mimetype
            }
        });

        blobStream.on('error', (err) => {
            console.error('Storage upload error:', err);
            res.status(500).send(err.message);
        });

        blobStream.on('finish', async () => {
            // Get public URL or signed URL
            const [url] = await blob.getSignedUrl({
                action: 'read',
                expires: '03-09-2491' // Far future
            });

            // 3. Store metadata and text in Firestore
            const docRef = await db.collection('rag_documents').add({
                name: fileName,
                content: text,
                size,
                type: mimetype,
                fileUrl: url,
                storagePath: blob.name,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 4. Force RagService to sync
            await ragService.initialize(); // Ensure initialized
            await ragService.syncFromFirestore();

            res.status(200).json({ 
                id: docRef.id, 
                name: fileName,
                message: 'Document uploaded and indexed successfully.' 
            });
        });

        blobStream.end(buffer);

    } catch (error) {
        console.error('Error uploading RAG doc:', error);
        res.status(500).send(error.message);
    }
};

const deleteDocument = async (req, res) => {
    const { id } = req.params;
    try {
        const docRef = db.collection('rag_documents').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).send('Document not found');
        }

        const data = doc.data();
        
        // 1. Delete from Storage
        if (data.storagePath) {
            try {
                await bucket.file(data.storagePath).delete();
            } catch (storageError) {
                console.warn('Could not delete file from storage (might already be gone):', storageError.message);
            }
        }

        // 2. Delete from Firestore
        await docRef.delete();

        // 3. Force RagService to sync
        await ragService.syncFromFirestore();

        res.status(200).json({ status: 'success', message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting RAG doc:', error);
        res.status(500).send(error.message);
    }
};

module.exports = {
    listDocuments,
    uploadDocument,
    deleteDocument
};
