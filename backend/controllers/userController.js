const { admin } = require('../config/firebaseAdmin');
const { getUserRole } = require('../middleware/authMiddleware');

const db = admin.firestore();

// Internal helper to log history events (same as doctorController)
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

const getRole = async (req, res) => {
  const role = await getUserRole(req.user.email);
  res.status(200).json({ role });
};

const syncData = async (req, res) => {
  const { section, data } = req.body;
  const uid = req.user.uid;

  if (!section || !data) {
    return res.status(400).send('Missing section or data');
  }

  try {
    let collectionName = 'data';
    let docName = section;

    if (['labs', 'consultation', 'shipment', 'tracking'].includes(section)) {
        collectionName = 'tracking';
    } else if (['prescription', 'notes', 'clinic'].includes(section)) {
        collectionName = 'clinic';
    } else if (section === 'media_reports') {
        collectionName = 'media_reports';
    }

    // Handle nested 'tracking' or 'clinic' updates if passed as a bulk object (same as doctorController)
    if (section === 'tracking') {
        const uid = req.user.uid;
        if (data.labs) {
            const ref = db.collection('users').doc(uid).collection('tracking').doc('labs');
            const currentSnap = await ref.get();
            const currentStatus = currentSnap.exists ? currentSnap.data().status : 'booked';
            
            await ref.set({ ...data.labs, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

            if (data.labs.status === 'completed' && currentStatus !== 'completed') {
                await logHistory(uid, {
                    type: 'Labs',
                    title: 'Lab Results Completed',
                    description: 'Your lab results have been reviewed and finalized.',
                    context: { labs: data.labs }
                });
            }
        }
        if (data.consultation) {
            const ref = db.collection('users').doc(uid).collection('tracking').doc('consultation');
            const currentSnap = await ref.get();
            const currentStatus = currentSnap.exists ? currentSnap.data().status : 'booked';

            await ref.set({ ...data.consultation, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

            if (data.consultation.status === 'completed' && currentStatus !== 'completed') {
                await logHistory(uid, {
                    type: 'Consultation',
                    title: 'Doctor Consultation Completed',
                    description: 'Your metabolic review has been finalized.',
                    context: { consult: data.consultation }
                });
            }
        }
        if (data.shipment) {
             const ref = db.collection('users').doc(uid).collection('tracking').doc('shipment');
             const currentSnap = await ref.get();
             const currentStatus = currentSnap.exists ? currentSnap.data().status : 'Awaiting';

             await ref.set({ ...data.shipment, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

             if (data.shipment.status === 'Delivered' && currentStatus !== 'Delivered') {
                 await logHistory(uid, {
                     type: 'Shipment',
                     title: 'Medication Delivered',
                     description: 'You have successfully received your prescribed medication.',
                     context: { shipment: data.shipment }
                 });
             }
        }
        return res.status(200).json({ status: 'success', message: 'Updated tracking docs' });
    }

    if (section === 'clinic' && data.prescription) {
         const ref = db.collection('users').doc(uid).collection('clinic').doc('prescription');
         await ref.set({ ...data.prescription, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
         return res.status(200).json({ status: 'success', message: 'Updated prescription' });
    }

    if (section === 'media_reports') {
        // 'data' here is expected to be a single report object OR an array of reports
        // If it's an array (initial sync/legacy), we iterate. 
        // But usually it should be a single report update.
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

    const docRef = db.collection('users').doc(uid).collection(collectionName).doc(docName);
    const prevSnap = await docRef.get();
    const prevData = prevSnap.exists ? prevSnap.data() : {};

    await docRef.set({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Detect Intake Completion
    if (section === 'profile' && data.status === 'Assessment Review' && prevData.status === 'Action Required') {
         await logHistory(uid, {
            type: 'Assessment',
            title: 'Digital Data Intake Completed',
            description: 'Patient finished the initial metabolic and psychographics assessment.'
         });
    }

    console.log(`📡 Synced ${section} for user ${uid} to ${collectionName}/${docName}`);
    res.status(200).json({ status: 'success', message: `Synced ${section}` });
  } catch (error) {
    console.error('❌ Firestore Sync Error:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
};

const getData = async (req, res) => {
  const uid = req.user.uid;

  try {
    const dataRef = db.collection('users').doc(uid).collection('data');
    const trackingRef = db.collection('users').doc(uid).collection('tracking');
    const clinicRef = db.collection('users').doc(uid).collection('clinic');
    const historyColRef = db.collection('users').doc(uid).collection('patient_history').orderBy('timestamp', 'desc');

    const [dataSnap, trackingSnap, clinicSnap, historyColSnap, mediaSnap] = await Promise.all([
        dataRef.get(),
        trackingRef.get(),
        clinicRef.get(),
        historyColRef.get(),
        db.collection('users').doc(uid).collection('media_reports').get()
    ]);

    const data = {};
    
    // 1. Data Collection (Flattened keys: profile, psych, medical...)
    dataSnap.forEach(doc => {
      data[doc.id] = doc.data();
    });
    
    // 2. Tracking Collection (Nested in 'tracking' key)
    data.tracking = {};
    trackingSnap.forEach(doc => {
        data.tracking[doc.id] = doc.data();
    });

    // 3. Clinic Collection (Nested in 'clinic' key)
    data.clinic = {};
    clinicSnap.forEach(doc => {
        data.clinic[doc.id] = doc.data();
    });

    // 4. Reports (Mapped from 'media_reports' subcollection)
    data.reports = [];
    mediaSnap.forEach(doc => {
        data.reports.push({
            ...doc.data(),
            id: doc.id
        });
    });

    // Fallback: Check if there's legacy reports in 'medical' doc
    if (data.reports.length === 0 && data.medical && data.medical.reports) {
        data.reports = data.medical.reports;
    }

    // 5. Timeline (Mapped from 'history' in data collection)
    if (data.history && data.history.events) {
        data.timeline = data.history.events;
    }

    // 6. Patient History (From subcollection)
    data.patient_history = [];
    historyColSnap.forEach(doc => {
        const hData = doc.data();
        data.patient_history.push({
            id: doc.id,
            ...hData,
            date: hData.date || (hData.timestamp ? hData.timestamp.toDate().toLocaleDateString() : '')
        });
    });
    
    console.log(`📥 Fetched unified data for user ${uid}`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Firestore Fetch Error:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
};

module.exports = { getRole, syncData, getData };
