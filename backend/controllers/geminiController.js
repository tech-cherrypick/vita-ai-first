const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const generateContent = async (req, res) => {
    const { model, contents, config, systemInstruction, tools } = req.body;

    if (!contents) {
        return res.status(400).json({ error: 'Missing required field: contents' });
    }

    try {
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
