const { admin } = require('../config/firebaseAdmin');

const db = admin.firestore();

const getAllPatients = async (req, res) => {
  try {
    // 1. Fetch all users from Firebase Auth
    const listUsersResult = await admin.auth().listUsers(1000);
    const authUsers = listUsersResult.users;

    if (!authUsers || authUsers.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Fetch all roles to filter out non-patients
    // We want to exclude doctors, care coordinators, admins, etc.
    const rolesSnapshot = await db.collection('roles').get();
    const roleMap = {};
    rolesSnapshot.forEach(doc => {
      roleMap[doc.id] = doc.data().role; // doc.id is email
    });

    // 3. Filter authUsers
    // Keep user if they have no role defined (assume patient) OR explicit 'patient' role
    const patientUsers = authUsers.filter(user => {
        const role = roleMap[user.email];
        // If user has a specific role assigned and it is NOT 'patient', exclude them.
        if (role && role !== 'patient') return false;
        return true;
    });

    if (patientUsers.length === 0) {
      return res.status(200).json([]);
    }

    // 4. Construct references to patient data documents
    // Path: users/{uid}/data/{docName}
    const profileRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('profile')
    );
    const psychRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('psych')
    );
    const medicalRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('medical')
    );
    const vitalsRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('vitals')
    );
    const timelineRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('timeline')
    );
    // New references for detailed tracking
    const clinicRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('clinic')
    );
    const consultationRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('consultation')
    );
    const labsRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('labs')
    );

    // 5. Fetch all profiles, psych, medical, vitals, timeline, and new tracking docs in parallel
    const [
      profileSnapshots, 
      psychSnapshots, 
      medicalSnapshots, 
      vitalsSnapshots, 
      timelineSnapshots,
      clinicSnapshots,
      consultationSnapshots,
      labsSnapshots
    ] = await Promise.all([
      db.getAll(...profileRefs),
      db.getAll(...psychRefs),
      db.getAll(...medicalRefs),
      db.getAll(...vitalsRefs),
      db.getAll(...timelineRefs),
      db.getAll(...clinicRefs),
      db.getAll(...consultationRefs),
      db.getAll(...labsRefs)
    ]); 

    // 6. Map results
    const patients = patientUsers.map((user, index) => {
      const profileSnap = profileSnapshots[index];
      const psychSnap = psychSnapshots[index];
      const medicalSnap = medicalSnapshots[index];
      const vitalsSnap = vitalsSnapshots[index];
      const timelineSnap = timelineSnapshots[index];
      const clinicSnap = clinicSnapshots[index];
      const consultationSnap = consultationSnapshots[index];
      const labsSnap = labsSnapshots[index];
      
      const profile = profileSnap.exists ? profileSnap.data() : {};
      const psych = psychSnap.exists ? psychSnap.data() : {};
      const medical = medicalSnap.exists ? medicalSnap.data() : {};
      
      // Vitals might be flat or in 'list' property depending on how it was saved. 
      // App.tsx expects vitals array. Let's look for 'list' or just mapped object.
      // Usually { list: [...] } or just fields.
      const vitalsData = vitalsSnap.exists ? vitalsSnap.data() : {};
      const vitals = vitalsData.list || (vitalsData.weight ? [vitalsData] : []); // Simple fallback

      // Timeline
      const timelineData = timelineSnap.exists ? timelineSnap.data() : {};
      const timeline = timelineData.events || [];

      // Detailed Tracking Data
      const clinic = clinicSnap.exists ? clinicSnap.data() : {};
      const consultation = consultationSnap.exists ? consultationSnap.data() : {};
      const labs = labsSnap.exists ? labsSnap.data() : {};

      // --- Derive Status & Next Action ---
      // Check if intake is substantially complete
      const hasPsych = Object.keys(psych).length > 0;
      const hasMedical = Object.keys(medical).length > 0;
      // Vitals check: check if list has entries OR profile has weight
      const hasVitals = vitals.length > 0 || (profile.weight !== undefined);

      let status = profile.status || 'Action Required';
      let nextAction = profile.nextAction || 'Complete medical intake assessment';

      // Computed Override: If all intake data is present but status is still "Action Required", advance it.
      if (hasPsych && hasMedical && hasVitals) {
          if (status === 'Action Required' || !profile.status) {
              status = 'Ready for Consult';
          }
          if (nextAction === 'Complete medical intake assessment' || !profile.nextAction) {
              nextAction = 'Review Patient Chart';
          }
      }

      return {
        // Auth Data Defaults
        id: user.uid,
        name: user.displayName || 'Unknown User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        photoURL: user.photoURL,
        // Firestore Data Overrides
        ...profile,
        // Derived Fields (Override profile if computed)
        status,
        nextAction,
        // Sub-collections
        psych,
        medical,
        vitals,
        timeline,
        // New Tracking Fields
        clinic,
        consultation,
        labs,
        // Ensure ID matches
        id: profile.id || user.uid
      };
    });

    res.status(200).json(patients);
  } catch (error) {
    console.error('❌ Error in getAllPatients:', error);
    res.status(500).send('Internal Server Error');
  }
};

const updatePatientData = async (req, res) => {
  const { patientId, section, data } = req.body;
  
  if (!patientId || !section || !data) {
    return res.status(400).send('Missing patientId, section, or data');
  }

  try {
    // 1. Resolve Doctor Name from req.user.uid
    const doctorDoc = await db.collection('users').doc(req.user.uid).get();
    const doctorData = doctorDoc.exists ? doctorDoc.data() : {};
    const doctorName = doctorData.name || doctorData.displayName || req.user.email || 'Unknown Doctor';

    // 2. Write to the specific patient's sub-collection
    // Path: users/{patientId}/data/{section}
    const docRef = db.collection('users').doc(String(patientId)).collection('data').doc(section);
    
    await docRef.set({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by_doctor: req.user.uid, // Audit trail (ID)
      doctorName: doctorName // Audit trail (Name) - Requested Feature
    }, { merge: true });

    console.log(`👨‍⚕️ Doctor ${doctorName} (${req.user.email}) updated ${section} for patient ${patientId}`);
    res.status(200).json({ status: 'success', message: `Updated ${section} for patient ${patientId}` });
  } catch (error) {
    console.error('❌ Error in updatePatientData:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
};

module.exports = { getAllPatients, updatePatientData };
