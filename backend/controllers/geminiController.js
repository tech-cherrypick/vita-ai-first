const { GoogleGenAI } = require('@google/genai');
const { admin } = require('../config/firebaseAdmin');
const db = admin.firestore();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ragService = require('../services/ragService');

/**
 * Fetches patient-specific data to provide personalized AI context.
 */
const getPatientContext = async (uid) => {
    if (!uid) return '';
    try {
        console.log(`👤 Fetching context for patient: ${uid}`);
        const userDoc = db.collection('users').doc(uid);
        // We fetch profile, psych, medical evaluations and recent history
        const [dataSnap, clinicSnap, historySnap] = await Promise.all([
            userDoc.collection('data').get(),
            userDoc.collection('clinic').get(),
            userDoc.collection('patient_history').orderBy('timestamp', 'desc').limit(10).get()
        ]);

        let context = "\n### PATIENT PROFILE & PREFERENCES (PERSONALIZED CONTEXT):\n";
        context += "Use the following data to personalize your response for this specific patient. Priority: Preferences > Clinical scores > History.\n";
        
        dataSnap.forEach(doc => {
            const data = doc.data();
            // Clean up timestamps for better readability
            delete data.updated_at;
            context += `\n[${doc.id.toUpperCase()} DATA]\n${JSON.stringify(data, null, 2)}\n`;
        });

        clinicSnap.forEach(doc => {
            const data = doc.data();
            delete data.updated_at;
            context += `\n[CLINICAL: ${doc.id.toUpperCase()}]\n${JSON.stringify(data, null, 2)}\n`;
        });

        if (!historySnap.empty) {
            context += "\n[RECENT PATIENT HISTORY]\n";
            historySnap.forEach(doc => {
                const data = doc.data();
                const date = data.date || (data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'Unknown Date');
                context += `- ${date}: ${data.title} - ${data.description}\n`;
            });
        }

        return context;
    } catch (error) {
        console.error(`❌ Error fetching patient context for ${uid}:`, error);
        return '';
    }
};

const generateContent = async (req, res) => {
    let { model, contents, config, systemInstruction, tools, patientId } = req.body;

    if (!contents) {
        return res.status(400).json({ error: 'Missing required field: contents' });
    }

    try {
        // Identify the patient for context (either from body for admin/doctor or from token for patient)
        const targetPatientId = patientId || (req.user ? req.user.uid : null);
        let patientContext = '';
        if (targetPatientId) {
            patientContext = await getPatientContext(targetPatientId);
        }

        // Limit chat history to the last 5 messages (or fewer to start with a 'user' message)
        if (contents.length > 5) {
            let startIndex = contents.length - 5;
            if (contents[startIndex].role === 'model') {
                startIndex += 1;
            }
            contents = contents.slice(startIndex);
        }

        // Retrieve relevant chunks if it's a user query
        const lastMessage = contents[contents.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
            const userQuery = lastMessage.parts.map(p => p.text).join(' ');
            console.log(`🔍 Searching RAG for: "${userQuery}"`);
            const relevantChunks = await ragService.retrieveRelevantChunks(userQuery);
            
            // Grounding prompt to enforce document priority, scope, and health focus
            let groundedPrompt = `
### PROJECT SCOPE:
You are an AI assistant for a Weight Loss and Obesity Management program. Your primary focus is Health, Nutrition, GLP-1 therapy, and Healthy Cooking.

${patientContext}
`;

            if (relevantChunks.length > 0) {
                const ragContext = relevantChunks.map(c => `[Source: ${c.source}] ${c.content}`).join('\n\n');
                groundedPrompt += `
### INTERNAL DOCUMENTS CONTEXT (HIGHEST PRIORITY):
The following information is retrieved from our verified internal documents. You MUST prioritize this information.
---
${ragContext}
---
`;
                console.log(`✅ Injected ${relevantChunks.length} relevant chunks for RAG.`);
            }

            groundedPrompt += `
### USER QUERY:
"${userQuery}"

### SYSTEM INSTRUCTIONS:
1. **Document Fidelity**: If the user asks for a specific recipe (like "jeera-rice") and it exists in the documents above, you MUST use that specific version (e.g., the cauliflower rice version if that's what's in the docs). Do NOT confuse multiple recipes in the context; select the one that exactly matches the user query.
2. **Healthy Fallback**: If the requested recipe or topic is NOT in the internal documents:
   - First, state: "I couldn't find a specific version of this in the internal documents, but here is a healthy version suitable for your weight loss journey:"
   - Then, provide a version that is strictly "Weight-Loss / Obesity-Management Friendly" (e.g., suggest cauliflower rice instead of white rice, avoid refined sugars, suggest lean proteins).
3. **Out of Scope Refusal**: If the query is completely unrelated to health, nutrition, or weight management (e.g., "plan a trip", "who is the president", "tech support"), politely refuse by stating: "I'm specialized in health, nutrition, and your weight loss journey. I can't help with [topic], but I'd be happy to answer any questions about your diet or health!"
4. **Accuracy**: If you use document information, mention it is from the internal documentation.
5. **Personalization**: Use the PATIENT PROFILE & PREFERENCES (if provided) to tailor your tone and advice. For example, if they have high BES (Binge Eating) scores, be more empathetic regarding food impulses.
`;
            // Inject the grounded prompt into the last message
            lastMessage.parts = [{ text: groundedPrompt }];
            
            if (patientContext) console.log(`👤 Personalized context injected for patient ${targetPatientId}`);
        }

        const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        console.log(`🤖 Sending request to ${model || 'gemini-2.0-flash'} via models.generateContent...`);

        const sdkConfig = { ...(config || {}) };
        if (systemInstruction) sdkConfig.systemInstruction = systemInstruction;
        if (tools) sdkConfig.tools = tools;

        const result = await genAI.models.generateContent({
            model: model || 'gemini-2.0-flash',
            contents,
            config: sdkConfig
        });
        
        const text = result.text;
        const functionCalls = result.functionCalls;

        const responseParts = [];
        if (text) responseParts.push({ text });
        if (functionCalls && functionCalls.length > 0) {
            functionCalls.forEach(fc => responseParts.push({ functionCall: fc }));
        }

        res.status(200).json({ text, functionCalls, parts: responseParts });
    } catch (error) {
        console.error('❌ Gemini API Error Details:', error);
        res.status(500).json({ 
            error: 'Failed to generate content',
            message: error.message 
        });
    }
}

module.exports = { generateContent, getPatientContext };
