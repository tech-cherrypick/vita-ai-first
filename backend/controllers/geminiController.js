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
                
                // Grounding prompt to enforce document priority, scope, and health focus
                const groundedPrompt = `
### PROJECT SCOPE:
You are an AI assistant for a Weight Loss and Obesity Management program. Your primary focus is Health, Nutrition, GLP-1 therapy, and Healthy Cooking.

### INTERNAL DOCUMENTS CONTEXT (HIGHEST PRIORITY):
The following information is retrieved from our verified internal documents. You MUST prioritize this information.
---
${context}
---

### USER QUERY:
"${userQuery}"

### SYSTEM INSTRUCTIONS:
1. **Document Fidelity**: If the user asks for a specific recipe (like "jeera-rice") and it exists in the documents above, you MUST use that specific version (e.g., the cauliflower rice version if that's what's in the docs). Do NOT confuse multiple recipes in the context; select the one that exactly matches the user query.
2. **Healthy Fallback**: If the requested recipe or topic is NOT in the internal documents:
   - First, state: "I couldn't find a specific version of this in the internal documents, but here is a healthy version suitable for your weight loss journey:"
   - Then, provide a version that is strictly "Weight-Loss / Obesity-Management Friendly" (e.g., suggest cauliflower rice instead of white rice, avoid refined sugars, suggest lean proteins).
3. **Out of Scope Refusal**: If the query is completely unrelated to health, nutrition, or weight management (e.g., "plan a trip", "who is the president", "tech support"), politely refuse by stating: "I'm specialized in health, nutrition, and your weight loss journey. I can't help with [topic], but I'd be happy to answer any questions about your diet or health!"
4. **Accuracy**: If you use document information, mention it is from the internal documentation.
`;
                // Inject the grounded prompt into the last message
                lastMessage.parts = [{ text: groundedPrompt }];
                
                console.log(`✅ Injected ${relevantChunks.length} relevant chunks with health/scope guardrails.`);
            }
        }

        const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        
        console.log(`🤖 Sending request to ${model || 'gemini-2.0-flash'} via models.generateContent...`);
        
        const result = await genAI.models.generateContent({ 
            model: model || 'gemini-2.0-flash',
            contents,
            generationConfig: config,
            systemInstruction,
            tools
        });
        
        // The result structure for this specific SDK
        const text = result.text;
        const functionCalls = result.functionCalls;

        res.status(200).json({ text, functionCalls });
    } catch (error) {
        console.error('❌ Gemini API Error Details:', error);
        res.status(500).json({ 
            error: 'Failed to generate content',
            message: error.message 
        });
    }
}

module.exports = { generateContent };
