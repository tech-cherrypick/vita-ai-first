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
      ),
      // Fetch prescriptions subcollections for each user
      ...patientUsers.map(user => 
        db.collection('users').doc(user.uid).collection('prescriptions').orderBy('updated_at', 'desc').get()
      ),
      // Fetch media_reports subcollections for each user
      ...patientUsers.map(user => 
        db.collection('users').doc(user.uid).collection('media_reports').orderBy('updated_at', 'desc').get()
      ),
      // Fetch current_loop subcollections for each user
      ...patientUsers.map(user => 
        db.collection('users').doc(user.uid).collection('current_loop').get()
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
    const historySubCollections = results.slice(9, 9 + patientUsers.length);
    const prescriptionSubCollections = results.slice(9 + patientUsers.length, 9 + 2 * patientUsers.length);
    const mediaSubCollections = results.slice(9 + 2 * patientUsers.length, 9 + 3 * patientUsers.length);
    const currentLoopSubCollections = results.slice(9 + 3 * patientUsers.length);

    // 6. Map results
    const patients = patientUsers.map((user, index) => {
      const profile = profileSnapshots[index].exists ? profileSnapshots[index].data() : {};
      const psych = psychSnapshots[index].exists ? psychSnapshots[index].data() : {};
      
      // Reports
      const medicalData = medicalSnapshots[index].exists ? medicalSnapshots[index].data() : {};

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
          if (safeProfile.careTeam.coordinator === 'Alex Ray' || safeProfile.careTeam.coordinator === 'Unassigned' || safeProfile.careTeam.coordinator === 'Vita-AI') {
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

      // Clinic & Prescriptions
      const legacyRx = prescriptionSnapshots[index].exists ? prescriptionSnapshots[index].data() : null;
      const clinic = {
          prescription: legacyRx
      };

      const prescriptions = [];
      if (prescriptionSubCollections[index]) {
          prescriptionSubCollections[index].forEach(doc => {
              prescriptions.push({
                  id: doc.id,
                  ...doc.data()
              });
          });
      }

      // Media Reports from subcollection
      const reportsFromSub = [];
      if (mediaSubCollections[index]) {
          mediaSubCollections[index].forEach(doc => {
              reportsFromSub.push({
                  ...doc.data(),
                  id: doc.id
              });
          });
      }

      // Merge with legacy reports if needed
      const reports = reportsFromSub.length > 0 ? reportsFromSub : (medicalData.reports || []);

      // Current Loop Persistence from subcollection
      const current_loop = {};
      if (currentLoopSubCollections[index]) {
          currentLoopSubCollections[index].forEach(doc => {
              current_loop[doc.id] = doc.data();
          });
      }

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
        prescriptions: prescriptions.length > 0 ? prescriptions : (legacyRx ? [legacyRx] : []),
        patient_history,
        current_loop,
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
        const uid = String(patientId);
        const doctorDoc = await db.collection('users').doc(req.user.uid).get();
        const doctorData = doctorDoc.exists ? doctorDoc.data() : {};
        const updaterName = doctorData.name || doctorData.displayName || req.user.email || 'Unknown User';

        // Fetch patient profile to get assigned physician
        const patientProfileDoc = await db.collection('users').doc(uid).collection('data').doc('profile').get();
        const patientProfile = patientProfileDoc.exists ? patientProfileDoc.data() : {};
        const physicianName = patientProfile.careTeam?.physician || 'the assigned physician';

        // Router for Collections
        let collectionName = 'data';
        let docName = section;

        if (['labs', 'consultation', 'shipment', 'tracking'].includes(section)) {
            collectionName = 'tracking';
        } else if (['prescription', 'notes', 'clinic'].includes(section)) {
            collectionName = 'clinic';
        } else if (section === 'media_reports') {
            collectionName = 'media_reports';
        } else {
            collectionName = 'data'; // profile, psych, medical(reports), vitals, history, timeline
        }

        // Special case handling for nested updates from frontend
        if (section === 'tracking') {
            console.log(`🔌 [doctorController] Processing TRACKING update for UID: ${uid}. Data keys: ${Object.keys(data).join(', ')}`);
            
            const batch = db.batch();
            let hasOps = false;

            if (data.labs) {
                console.log(`🧪 Updating Labs for UID: ${uid}`);
                const ref = db.collection('users').doc(uid).collection('tracking').doc('labs');
                const loopRef = db.collection('users').doc(uid).collection('current_loop').doc('labs');
                const currentSnap = await ref.get();
                const currentStatus = (currentSnap.exists && currentSnap.data().status) ? currentSnap.data().status : 'booked';

                const newStatus = data.labs.status || currentStatus;
                
                // Persistence: Always update current_loop for UI tracking
                batch.set(loopRef, {
                    ...data.labs,
                    status: newStatus,
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                if (data.labs.status === 'completed' && currentStatus !== 'completed') {
                    await logHistory(uid, {
                        type: 'Labs',
                        title: 'Lab Results Completed',
                        description: 'Patient lab results have been reviewed and finalized.',
                        doctor: physicianName,
                        updater: updaterName,
                        context: { labs: data.labs }
                    });
                    // Move-and-Delete: Remove from tracking once completed
                    batch.delete(ref);
                    console.log(`🗑️ [doctorController] Deleted tracking/labs for UID: ${uid} (Completed)`);
                } else {
                    batch.set(ref, {
                        ...data.labs,
                        status: newStatus,
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                hasOps = true;
            }

            if (data.consultation) {
                const ref = db.collection('users').doc(uid).collection('tracking').doc('consultation');
                const loopRef = db.collection('users').doc(uid).collection('current_loop').doc('consultation');
                const currentSnap = await ref.get();
                const currentStatus = (currentSnap.exists && currentSnap.data().status) ? currentSnap.data().status : 'booked';

                const newStatus = data.consultation.status || currentStatus;

                // Persistence: Always update current_loop for UI tracking
                batch.set(loopRef, {
                    ...data.consultation,
                    status: newStatus,
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                if (data.consultation.status === 'completed' && currentStatus !== 'completed') {
                    await logHistory(uid, {
                        type: 'Consultation',
                        title: 'Doctor Consultation Completed',
                        description: `Metabolic review with ${physicianName.startsWith('Dr.') ? physicianName : 'Dr. ' + physicianName} finalized.`,
                        doctor: physicianName,
                        updater: updaterName,
                        context: { consult: data.consultation }
                    });
                    // Move-and-Delete: Remove from tracking once completed
                    batch.delete(ref);
                    console.log(`🗑️ [doctorController] Deleted tracking/consultation for UID: ${uid} (Completed)`);
                } else {
                    batch.set(ref, {
                        ...data.consultation,
                        status: newStatus,
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                hasOps = true;
            }

            if (data.shipment) {
                const ref = db.collection('users').doc(uid).collection('tracking').doc('shipment');
                const loopRef = db.collection('users').doc(uid).collection('current_loop').doc('shipment');
                const currentSnap = await ref.get();
                const currentStatus = (currentSnap.exists && currentSnap.data().status) ? currentSnap.data().status : 'Awaiting';

                const newStatus = data.shipment.status || currentStatus;

                // Persistence: Always update current_loop for UI tracking
                batch.set(loopRef, {
                    ...data.shipment,
                    status: newStatus,
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                if (data.shipment.status === 'Delivered' && currentStatus !== 'Delivered') {
                    await logHistory(uid, {
                        type: 'Shipment',
                        title: 'Medication Delivered',
                        description: 'The patient has successfully received their prescribed medication.',
                        doctor: physicianName,
                        updater: updaterName,
                        context: { shipment: data.shipment }
                    });
                    // Move-and-Delete: Remove from tracking once delivered
                    batch.delete(ref);
                    console.log(`🗑️ [doctorController] Deleted tracking/shipment for UID: ${uid} (Delivered)`);
                } else {
                    batch.set(ref, { 
                        ...data.shipment, 
                        updated_at: admin.firestore.FieldValue.serverTimestamp() 
                    }, { merge: true });
                }
                hasOps = true;
            }
            
            if (hasOps) {
                await batch.commit();
            }
            return res.status(200).json({ status: 'success', message: 'Updated tracking docs' });
        }
    
    if (section === 'clinic' && data.prescription) {
        const uid = String(patientId);
        // 1. Save to many-to-one 'prescriptions' subcollection
        const rxRef = db.collection('users').doc(uid).collection('prescriptions');
        await rxRef.add({ 
            ...data.prescription, 
            status: data.prescription.status || 'Awaiting Shipment',
            authorized_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp() 
        });

        // 2. Automatically trigger/update Pharmacy Shipment task in tracking
        const shipmentRef = db.collection('users').doc(uid).collection('tracking').doc('shipment');
        await shipmentRef.set({
            status: 'Awaiting Shipment',
            name: data.prescription.name,
            dosage: data.prescription.dosage,
            authorized_by: physicianName,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 3. Update the 'active' prescription document in clinic collection for dashboard triggers
        const activeRxRef = db.collection('users').doc(uid).collection('clinic').doc('prescription');
        await activeRxRef.set({ 
            ...data.prescription, 
            status: 'Awaiting Shipment',
            authorized_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp() 
        }, { merge: true });

        // 4. Update current_loop/shipment for persistent progress visualization
        const loopRxRef = db.collection('users').doc(uid).collection('current_loop').doc('shipment');
        await loopRxRef.set({
            status: 'Awaiting Shipment',
            name: data.prescription.name,
            dosage: data.prescription.dosage,
            authorized_by: physicianName,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // 5. Log Rx Creation
        await logHistory(uid, {
            type: 'Protocol',
            title: 'Prescription Authorized',
            description: `A new prescription for ${data.prescription.name} has been authorized by ${physicianName.startsWith('Dr.') ? physicianName : 'Dr. ' + physicianName}.`,
            doctor: physicianName,
            updater: updaterName,
            context: { prescription: data.prescription }
        });

        return res.status(200).json({ status: 'success', message: 'Authorized prescription and triggered shipment task' });
    }

    if (section === 'media_reports') {
        const uid = String(patientId);
        if (Array.isArray(data)) {
            const batch = db.batch();
            data.forEach(report => {
                const ref = db.collection('users').doc(uid).collection('media_reports').doc(report.id);
                batch.set(ref, { ...report, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            });
            await batch.commit();
        } else if (data.id) {
            const ref = db.collection('users').doc(uid).collection('media_reports').doc(data.id);
            await ref.set({ ...data, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
        return res.status(200).json({ status: 'success', message: 'Updated media report' });
    }

    if (section === 'data' && docName === 'profile') {
        const currentCycle = data.currentCycle;
        if (currentCycle && (!patientProfile.currentCycle || currentCycle > patientProfile.currentCycle)) {
            console.log(`🔄 [doctorController] New Cycle Detected (${currentCycle}). Archiving current_loop...`);
            
            // 1. Move current_loop to all_loops/{prevCycle}
            const prevCycle = patientProfile.currentCycle || 1;
            const loopRef = db.collection('users').doc(uid).collection('current_loop');
            const archiveRef = db.collection('users').doc(uid).collection('all_loops').doc(`cycle_${prevCycle}`);
            
            const loopDocs = await loopRef.get();
            const loopData = {};
            loopDocs.forEach(doc => {
                loopData[doc.id] = doc.data();
            });
            
            if (Object.keys(loopData).length > 0) {
                await archiveRef.set({
                    ...loopData,
                    cycle: prevCycle,
                    archived_at: admin.firestore.FieldValue.serverTimestamp()
                });
                
                // 2. Clear current_loop for the new cycle
                const deleteBatch = db.batch();
                loopDocs.forEach(doc => {
                    deleteBatch.delete(doc.ref);
                });
                await deleteBatch.commit();
                console.log(`✅ [doctorController] Archived cycle ${prevCycle} and cleared current_loop`);
            }
        }
    }

    const docRef = db.collection('users').doc(String(patientId)).collection(collectionName).doc(docName);
    
    await docRef.set({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: req.user.uid,
      updaterName: updaterName,
      physicianName: physicianName
    }, { merge: true });

    // Milestone Logging: Intake Completed
    if (data.status === 'Assessment Review' && patientProfile.status !== 'Assessment Review') {
        console.log(`📝 [doctorController] Status change to Assessment Review detected for ${uid}. Logging history...`);
        await logHistory(uid, {
            type: 'Assessment',
            title: 'Intake Completed',
            description: `Care Coordinator (${updaterName}) marked patient intake as complete, moving them to Assessment Review.`,
            doctor: physicianName,
            updater: updaterName
        });
    }

    // Sync to current_loop if it's a tracking-related doc
    if (collectionName === 'tracking' && ['labs', 'consultation', 'shipment'].includes(docName)) {
        console.log(`🔄 [doctorController] Syncing individual tracking doc ${docName} for patient ${uid} to current_loop`);
        const loopRef = db.collection('users').doc(uid).collection('current_loop').doc(docName);
        await loopRef.set({
            ...data,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    console.log(`📡 ${updaterName} updated ${collectionName}/${docName} for patient ${patientId}`);
    res.status(200).json({ status: 'success', message: `Updated ${docName}` });
  } catch (error) {
    console.error('❌ Error in updatePatientData:', error);
    res.status(500).json({ 
        status: 'error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getChatHistory = async (req, res) => {
  const { patientIds } = req.body; // Array of strings
  if (!patientIds || !Array.isArray(patientIds)) {
    return res.status(400).send('Missing patientIds array');
  }

  try {
    const allMessages = [];
    // Firestore limit for getAll is small, so we might need to loop or use collectionGroup if indexed.
    // For now, let's fetch in parallel with a limit to avoid performance hits.
    const messagePromises = patientIds.map(async (pid) => {
      const snap = await db.collection('users').doc(pid).collection('messages').orderBy('timestamp', 'desc').limit(20).get();
      const msgs = [];
      snap.forEach(doc => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          patientId: pid,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString()
        });
      });
      return msgs;
    });

    const results = await Promise.all(messagePromises);
    results.forEach(msgs => allMessages.push(...msgs));

    res.status(200).json(allMessages);
  } catch (error) {
    console.error('❌ Error in getChatHistory:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { getAllPatients, updatePatientData, getChatHistory };
