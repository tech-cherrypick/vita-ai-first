const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');
const _ = require('lodash');
const { admin } = require('../config/firebaseAdmin');

class RagService {
    constructor() {
        this.chunks = [];
        this.isInitialized = false;
        this.modelName = 'gemini-embedding-2-preview';
        this.genAI = null;
        this.db = admin.firestore();
    }

    async initialize() {
        if (this.isInitialized) return;
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not found in environment. RAG Service will not be available.');
            return;
        }

        this.genAI = new GoogleGenAI({ apiKey });
        try {
            await this.loadDocuments();
            this.isInitialized = true;
            console.log(`✅ RAG Service initialized with ${this.chunks.length} chunks.`);
        } catch (error) {
            console.error('❌ Error initializing RAG Service:', error);
            // Don't throw here to allow app to start even if RAG fails
        }
    }

    async syncFromFirestore() {
        console.log('🔄 Syncing RAG documents from Firestore...');
        await this.loadDocuments();
        console.log(`✅ RAG Sync complete. ${this.chunks.length} chunks now in memory.`);
    }

    async loadDocuments() {
        try {
            const snapshot = await this.db.collection('rag_documents').get();
            if (snapshot.empty) {
                console.log('📄 No RAG documents found in Firestore.');
                this.chunks = [];
                return;
            }

            const allChunks = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.content) {
                    const fileChunks = this.chunkText(data.content, data.name || doc.id);
                    allChunks.push(...fileChunks);
                }
            });

            this.chunks = allChunks;

            if (this.chunks.length > 0) {
                console.log(`✅ Loaded ${this.chunks.length} chunks from ${snapshot.size} Firestore documents.`);
                await this.generateEmbeddings();
            }
        } catch (error) {
            console.error('❌ Error loading RAG documents from Firestore:', error);
        }
    }


    chunkText(text, fileName) {
        // Simple chunking strategy: ~1000 characters with 200 character overlap
        const chunkSize = 1000;
        const overlap = 200;
        const chunks = [];
        
        // Clean text (remove multiple newlines/excess whitespace)
        const cleanText = text.replace(/\s+/g, ' ').trim();
        
        for (let i = 0; i < cleanText.length; i += (chunkSize - overlap)) {
            const content = cleanText.substring(i, i + chunkSize);
            chunks.push({
                content,
                source: fileName,
                index: chunks.length
            });
            if (i + chunkSize >= cleanText.length) break;
        }
        
        return chunks;
    }

    async generateEmbeddings() {
        if (!this.genAI) return;
        console.log(`🧠 Generating embeddings for ${this.chunks.length} chunks...`);

        // Process in batches to avoid API limits if necessary
        const batchSize = 50;
        const batches = _.chunk(this.chunks, batchSize);

        for (const batch of batches) {
            const promises = batch.map(async (chunk) => {
                try {
                    const result = await this.genAI.models.embedContent({
                        model: this.modelName,
                        contents: [{ parts: [{ text: chunk.content }] }]
                    });
                    
                    if (result.embeddings && result.embeddings[0]) {
                        chunk.embedding = result.embeddings[0].values;
                    } else if (result.embedding) {
                        chunk.embedding = result.embedding.values;
                    }
                } catch (error) {
                    console.error(`❌ Error generating embedding for a chunk in ${chunk.source}:`, error);
                }
            });
            await Promise.all(promises);
        }
        console.log('✅ Embeddings generated.');
    }

    async retrieveRelevantChunks(query, topK = 5) {
        if (!this.isInitialized) await this.initialize();
        if (!this.genAI || this.chunks.length === 0) return [];

        try {
            const result = await this.genAI.models.embedContent({
                model: this.modelName,
                contents: [{ parts: [{ text: query }] }]
            });
            
            let queryEmbedding = null;
            if (result.embeddings && result.embeddings[0]) {
                queryEmbedding = result.embeddings[0].values;
            } else if (result.embedding) {
                queryEmbedding = result.embedding.values;
            }

            if (!queryEmbedding) {
                throw new Error('No embedding returned from API');
            }

            const scoredChunks = this.chunks.map(chunk => ({
                ...chunk,
                score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
            }));

            // Sort by score
            const sortedChunks = scoredChunks.sort((a, b) => b.score - a.score);
            
            // Set a similarity threshold (0.4 is generally a safe minimum for semantic relevance)
            const similarityThreshold = 0.45;
            const relevantChunks = sortedChunks.filter(chunk => chunk.score >= similarityThreshold);

            if (relevantChunks.length > 0) {
                console.log(`🔍 RAG: Found ${relevantChunks.length} chunks above threshold ${similarityThreshold}. Top score: ${relevantChunks[0].score.toFixed(4)}`);
            } else if (sortedChunks.length > 0) {
                console.log(`⚠️ RAG: No chunks found above threshold ${similarityThreshold}. Best score was ${sortedChunks[0].score.toFixed(4)}`);
            }

            // Take top K from the relevant ones
            return relevantChunks.slice(0, topK);
        } catch (error) {
            console.error('❌ Error retrieving relevant chunks:', error);
            return [];
        }
    }

    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

module.exports = new RagService();
