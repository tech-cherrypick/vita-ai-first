const { admin, initializeFirebase } = require('../config/firebaseAdmin');
initializeFirebase();

const db = admin.firestore();

async function migrate() {
    console.log('🚀 Starting Data Migration...');

    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users;
        console.log(`Found ${users.length} users in Auth.`);

        const batch = db.batch();
        let totalUpdated = 0;

        for (const user of users) {
            const uid = user.uid;
            console.log(`Processing user: ${uid}`);

            // 1. Check legacy 'data/labs'
            const legacyLabsRef = db.collection('users').doc(uid).collection('data').doc('labs');
            const legacyLabsSnap = await legacyLabsRef.get();
            
            if (legacyLabsSnap.exists) {
                const data = legacyLabsSnap.data();
                const newRef = db.collection('users').doc(uid).collection('tracking').doc('labs');
                batch.set(newRef, { 
                    ...data, 
                    status: data.status || 'booked',
                    migrated_at: admin.firestore.FieldValue.serverTimestamp() 
                }, { merge: true });
                // We DON'T delete the old one yet to be safe, or we can if we want to clean up.
                // batch.delete(legacyLabsRef); 
                console.log(`  - Moving labs for ${uid}`);
                totalUpdated++;
            }

            // 2. Check legacy 'data/consultation'
            const legacyConsultRef = db.collection('users').doc(uid).collection('data').doc('consultation');
            const legacyConsultSnap = await legacyConsultRef.get();
            
            if (legacyConsultSnap.exists) {
                const data = legacyConsultSnap.data();
                const newRef = db.collection('users').doc(uid).collection('tracking').doc('consultation');
                batch.set(newRef, { 
                    ...data, 
                    status: data.status || 'booked',
                    migrated_at: admin.firestore.FieldValue.serverTimestamp() 
                }, { merge: true });
                console.log(`  - Moving consultation for ${uid}`);
                totalUpdated++;
            }

            // 3. Initialize patient_history with creation date
            const historyRef = db.collection('users').doc(uid).collection('patient_history').doc('registration');
            const historySnap = await historyRef.get();
            
            if (!historySnap.exists) {
                // Try to get creation time from Auth if possible, but easier to just check user doc or use NOW as fallback
                let creationTime = 'Unknown';
                try {
                    const userAuth = await admin.auth().getUser(uid);
                    creationTime = userAuth.metadata.creationTime;
                } catch (e) {
                    console.warn(`Could not get auth metadata for ${uid}`);
                }

                batch.set(historyRef, {
                    type: 'Account Created',
                    date: creationTime,
                    title: 'Registration Completed',
                    description: 'Patient registered and profile created.',
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`  - Initialized history for ${uid}`);
            }
        }

        if (totalUpdated > 0 || usersSnapshot.size > 0) {
            await batch.commit();
            console.log(`✅ Migration complete. Updated ${totalUpdated} records.`);
        } else {
            console.log('ℹ️ No records found to migrate.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrate();
