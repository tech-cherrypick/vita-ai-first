const { admin } = require('../config/firebaseAdmin');

const db = admin.firestore();

// Internal helper to log history events
const logHistory = async (uid, event) => {
  try {
    const historyRef = db.collection('users').doc(uid).collection('patient_history');
    await historyRef.add({
      ...event,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error(`❌ Error logging history for ${uid}:`, error);
  }
};

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

    // 4. Construct references
    // Collection: 'data'
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
    const historyRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('history')
    );

    // Collection: 'tracking' (Parallel to data)
    const labsRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('tracking').doc('labs')
    );
    const consultRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('tracking').doc('consultation')
    );
    const shipmentRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('tracking').doc('shipment')
    );

    // Collection: 'clinic' (Parallel to data)
    const prescriptionRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('clinic').doc('prescription')
    );

    // 5. Fetch all docs in parallel
    const results = await Promise.all([
      db.getAll(...profileRefs),
      db.getAll(...psychRefs),
      db.getAll(...medicalRefs),
      db.getAll(...vitalsRefs),
      db.getAll(...historyRefs),
      db.getAll(...labsRefs),
      db.getAll(...consultRefs),
      db.getAll(...shipmentRefs),
      db.getAll(...prescriptionRefs),
      // Fetch history subcollections for each user
      ...patientUsers.map(user => 
        db.collection('users').doc(user.uid).collection('patient_history').orderBy('timestamp', 'desc').limit(20).get()
      )
    ]); 

    const profileSnapshots = results[0];
    const psychSnapshots = results[1];
    const medicalSnapshots = results[2];
    const vitalsSnapshots = results[3];
    const historySnapshots = results[4];
    const labsSnapshots = results[5];
    const consultSnapshots = results[6];
    const shipmentSnapshots = results[7];
    const prescriptionSnapshots = results[8];
    const historySubCollections = results.slice(9);

    // 6. Map results
    const patients = patientUsers.map((user, index) => {
      const profile = profileSnapshots[index].exists ? profileSnapshots[index].data() : {};
      const psych = psychSnapshots[index].exists ? psychSnapshots[index].data() : {};
      
      // Reports
      const medicalData = medicalSnapshots[index].exists ? medicalSnapshots[index].data() : {};
      const reports = medicalData.reports || [];

      // Vitals
      const vitalsData = vitalsSnapshots[index].exists ? vitalsSnapshots[index].data() : {};
      const vitals = vitalsData.list || (vitalsData.weight ? [vitalsData] : []);

      // History
      const historyData = historySnapshots[index].exists ? historySnapshots[index].data() : {};
      const history = historyData.events || [];

      // Tracking (Aggregated from 'tracking' collection docs)
      const labs = labsSnapshots[index].exists ? labsSnapshots[index].data() : {};
      const consultation = consultSnapshots[index].exists ? consultSnapshots[index].data() : {};
      const shipment = shipmentSnapshots[index].exists ? shipmentSnapshots[index].data() : {};
      const tracking = {
          labs,
          consultation,
          shipment
      };

      if (index === 0) {
          console.log(`🔍 [getAllPatients] Debug - UID: ${user.uid}`);
          console.log(`   Fetched History Events:`, historySubCollections[index] ? historySubCollections[index].size : 0);
      }

      // Dynamic Care Team Assignment
      // Find the first user with 'careCoordinator' role
      const coordinatorEmail = Object.keys(roleMap).find(email => roleMap[email] === 'careCoordinator');
      const coordinatorUser = coordinatorEmail ? authUsers.find(u => u.email === coordinatorEmail) : null;
      const defaultCoordinatorName = coordinatorUser?.displayName || 'Vita Care Team'; // Fallback if no CC found

      // Helper to fix Profile Data
      const safeProfile = { ...profile };
      if (!safeProfile.careTeam) {
          safeProfile.careTeam = { physician: 'Pending Assignment', coordinator: defaultCoordinatorName };
      } else {
          // Check for legacy/default values and override
          if (safeProfile.careTeam.coordinator === 'Alex Ray' || safeProfile.careTeam.coordinator === 'Unassigned') {
               safeProfile.careTeam.coordinator = defaultCoordinatorName;
          }
      }

      // Patient History from subcollection
      const patient_history = [];
      if (historySubCollections[index]) {
          historySubCollections[index].forEach(doc => {
              const hData = doc.data();
              patient_history.push({
                  id: doc.id,
                  ...hData,
                  // format date if it's a timestamp
                  date: hData.date || (hData.timestamp ? hData.timestamp.toDate().toLocaleDateString() : '')
              });
          });
      }

      // Clinic
      const prescription = prescriptionSnapshots[index].exists ? prescriptionSnapshots[index].data() : null;
      const clinic = {
          prescription
      };

      // Status Derived
      let status = profile.status || 'Action Required';
      
      return {
        ...profile,
        psych,
        reports,
        vitals,
        history,
        timeline: history,
        tracking,
        clinic,
        patient_history,
        medical: medicalData,
        id: user.uid // Ensure Auth UID overrides any numeric ID in profile
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
  console.log(`🔌 [doctorController] updatePatientData: id=${patientId}, section=${section}`);
  console.log(`📦 Data payload:`, JSON.stringify(data, null, 2));
  
  if (!patientId || !section || !data) {
    return res.status(400).send('Missing patientId, section, or data');
  }

  try {
    const doctorDoc = await db.collection('users').doc(req.user.uid).get();
    const doctorData = doctorDoc.exists ? doctorDoc.data() : {};
    const doctorName = doctorData.name || doctorData.displayName || req.user.email || 'Unknown Doctor';

    // Router for Collections
    let collectionName = 'data';
    let docName = section;

    if (['labs', 'consultation', 'shipment', 'tracking'].includes(section)) {
        collectionName = 'tracking';
    } else if (['prescription', 'notes', 'clinic'].includes(section)) {
        collectionName = 'clinic';
    } else {
        collectionName = 'data'; // profile, psych, medical(reports), vitals, history, timeline
    }

    // Special case handling for nested updates from frontend
    // If frontend sends section='tracking' with data={ labs: ... }, we need to route to 'tracking/labs'?
    // The frontend currently sends 'tracking' as the section name in App.tsx.
    // We should split this. If section is 'tracking', we might need to iterate keys?
    // Or simpler: Frontend should send 'labs', 'consultation' as sections?
    // Let's adjust this controller to handle the 'tracking' section payload from App.tsx.
    
    if (section === 'tracking') {
        console.log(`🔌 [doctorController] Processing TRACKING update. Data keys: ${Object.keys(data).join(', ')}`);
        if(data.labs) console.log(`🧪 Labs Update Payload:`, JSON.stringify(data.labs, null, 2));
        
        const batch = db.batch();
        const uid = String(patientId);
        
        if (data.labs) {
            console.log(`🧪 Updating Labs for UID: ${uid}`);
            const ref = db.collection('users').doc(uid).collection('tracking').doc('labs');
            const currentSnap = await ref.get();
            const currentStatus = currentSnap.exists ? currentSnap.data().status : 'booked';
            
            // Explicitly prioritize incoming status, fallback to current only if undefined
            const newStatus = data.labs.status !== undefined ? data.labs.status : currentStatus;
            console.log(`🧪 Status Change: ${currentStatus} -> ${newStatus}`);

            batch.set(ref, { 
                ...data.labs, 
                status: newStatus,
                updated_at: admin.firestore.FieldValue.serverTimestamp() 
            }, { merge: true });
            
            if (data.labs.status === 'completed' && currentStatus !== 'completed') {
                await logHistory(uid, {
                    type: 'Labs',
                    title: 'Lab Results Completed',
                    description: 'Patient lab results have been reviewed and finalized.',
                    doctor: doctorName,
                    context: { labs: data.labs }
                });
            }
        }
        
        if (data.consultation) {
            const ref = db.collection('users').doc(uid).collection('tracking').doc('consultation');
            const currentSnap = await ref.get();
            const currentStatus = currentSnap.exists ? currentSnap.data().status : 'booked';
            
            batch.set(ref, { 
                ...data.consultation, 
                status: data.consultation.status || currentStatus,
                updated_at: admin.firestore.FieldValue.serverTimestamp() 
            }, { merge: true });

            if (data.consultation.status === 'completed' && currentStatus !== 'completed') {
                await logHistory(uid, {
                    type: 'Consultation',
                    title: 'Doctor Consultation Completed',
                    description: `Metabolic review with Dr. ${doctorName} finalized.`,
                    doctor: doctorName,
                    context: { consult: data.consultation }
                });
            }
        }
        
        if (data.shipment) {
            const ref = db.collection('users').doc(uid).collection('tracking').doc('shipment');
            const currentSnap = await ref.get();
            const currentStatus = currentSnap.exists ? currentSnap.data().status : 'Awaiting';

            batch.set(ref, { 
                ...data.shipment, 
                updated_at: admin.firestore.FieldValue.serverTimestamp() 
            }, { merge: true });

            if (data.shipment.status === 'Delivered' && currentStatus !== 'Delivered') {
                await logHistory(uid, {
                    type: 'Shipment',
                    title: 'Medication Delivered',
                    description: 'The patient has successfully received their prescribed medication.',
                    doctor: doctorName,
                    context: { shipment: data.shipment }
                });
            }
        }
        
        await batch.commit();
        return res.status(200).json({ status: 'success', message: 'Updated tracking docs' });
    }
    
    if (section === 'clinic' && data.prescription) {
        const ref = db.collection('users').doc(String(patientId)).collection('clinic').doc('prescription');
        await ref.set({ 
            ...data.prescription, 
            status: data.prescription.status || 'Awaiting Shipment',
            updated_at: admin.firestore.FieldValue.serverTimestamp() 
        }, { merge: true });
        
        // Log Rx Creation if it's new (adjust as needed if replacement)
        await logHistory(String(patientId), {
            type: 'Protocol',
            title: 'Prescription Authorized',
            description: `A new prescription for ${data.prescription.name} has been authorized.`,
            doctor: doctorName
        });

        return res.status(200).json({ status: 'success', message: 'Updated prescription' });
    }

    const docRef = db.collection('users').doc(String(patientId)).collection(collectionName).doc(docName);
    
    await docRef.set({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by_doctor: req.user.uid,
      doctorName: doctorName
    }, { merge: true });

    console.log(`👨‍⚕️ Doctor ${doctorName} updated ${collectionName}/${docName} for patient ${patientId}`);
    res.status(200).json({ status: 'success', message: `Updated ${docName}` });
  } catch (error) {
    console.error('❌ Error in updatePatientData:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
};

module.exports = { getAllPatients, updatePatientData };
