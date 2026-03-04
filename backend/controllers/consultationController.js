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
    
    // REMOVED DUPLICATE SAVE TO PATIENT_HISTORY TO PREVENT STALE DATA
    // Consultations should now be fetched from the 'consultations' sub-collection only.
    /*
    await db.collection('users').doc(patientId).collection('patient_history').add({
      // settings...
    });
    */

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
