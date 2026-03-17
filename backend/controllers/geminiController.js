const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ragService = require('../services/ragService');

const generateContent = async (req, res) => {
    let { model, contents, config, systemInstruction, tools } = req.body;

    if (!contents) {
        return res.status(400).json({ error: 'Missing required field: contents' });
    }

    try {
        // Retrieve relevant chunks if it's a user query
        const lastMessage = contents[contents.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
            const userQuery = lastMessage.parts.map(p => p.text).join(' ');
            console.log(`🔍 Searching RAG for: "${userQuery}"`);
            const relevantChunks = await ragService.retrieveRelevantChunks(userQuery);
            
            if (relevantChunks.length > 0) {
                const context = relevantChunks.map(c => `[Source: ${c.source}] ${c.content}`).join('\n\n');
                const ragInstruction = `\n\nYou have access to the following relevant information from internal documents:\n${context}\n\nUse this information to provide a more accurate and detailed response. If the information is not relevant, you can ignore it.`;
                
                if (systemInstruction) {
                    if (typeof systemInstruction === 'string') {
                        systemInstruction += ragInstruction;
                    } else if (systemInstruction.parts) {
                        systemInstruction.parts.push({ text: ragInstruction });
                    }
                } else {
                    systemInstruction = {
                        role: 'system',
                        parts: [{ text: ragInstruction }]
                    };
                }
                console.log(`✅ Injected ${relevantChunks.length} chunks into context.`);
            }
        }

        const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const result = await genAI.models.generateContent({ 
            model: model || 'gemini-2.0-flash',
            contents,
            generationConfig: config,
            systemInstruction,
            tools
        });
        
        const text = result.text;
        const functionCalls = result.functionCalls;

        res.status(200).json({ text, functionCalls });
    } catch (error) {
        console.error('❌ Gemini API Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate content',
            message: error.message 
        });
    }
};

module.exports = { generateContent };
