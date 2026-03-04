const { admin } = require('../config/firebaseAdmin');
const db = admin.firestore();

// Note: Ensure @google/genai is installed in the backend
// npm install @google/genai
let GoogleGenAI;
try {
  GoogleGenAI = require('@google/genai').GoogleGenAI;
} catch (e) {
  console.warn('⚠️ @google/genai not found in backend. AI features will be limited.');
}

const saveTranscriptAndSummary = async (req, res) => {
  const { patientId, transcript, summary, duration, doctorId } = req.body;

  if (!patientId || !transcript) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const consultationRef = db.collection('users').doc(patientId).collection('consultations').doc();
    
    const consultationData = {
      id: consultationRef.id,
      patientId,
      doctorId: doctorId || 'assigned_doctor',
      transcript,
      summary: summary || 'No summary provided',
      duration: duration || 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      date: new Date().toISOString()
    };

    await consultationRef.set(consultationData);

    // Also update the latest consultation in patient history or tracking
    await db.collection('users').doc(patientId).collection('patient_history').add({
      type: 'Consultation',
      title: 'Consultation Summary Available',
      description: summary || 'No summary provided',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      context: { 
        consultationId: consultationRef.id, 
        summary: summary || 'No summary provided',
        transcript: transcript 
      }
    });

    res.status(200).json({ status: 'success', consultationId: consultationRef.id });
  } catch (error) {
    console.error('❌ Error saving consultation data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getConsultationDetails = async (req, res) => {
  const { consultationId, patientId } = req.params;

  try {
    const doc = await db.collection('users').doc(patientId).collection('consultations').doc(consultationId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    res.status(200).json(doc.data());
  } catch (error) {
    console.error('❌ Error fetching consultation details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { saveTranscriptAndSummary, getConsultationDetails };
