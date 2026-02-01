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

    // 4. Construct references to the 'profile' doc for valid patients
    // Path: users/{uid}/data/profile
    const profileRefs = patientUsers.map(user => 
      db.collection('users').doc(user.uid).collection('data').doc('profile')
    );

    // 5. Fetch all profiles in parallel using getAll
    const profileSnapshots = await db.getAll(...profileRefs);

    // 6. Map results
    const patients = patientUsers.map((user, index) => {
      const profileSnap = profileSnapshots[index];
      const profile = profileSnap.exists ? profileSnap.data() : {};

      return {
        // Auth Data Defaults
        id: user.uid,
        name: user.displayName || 'Unknown User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        photoURL: user.photoURL,
        // Firestore Data Overrides
        ...profile,
        // Ensure ID matches
        id: profile.id || user.uid
      };
    });

    console.log(`👨‍⚕️ Fetched ${patients.length} patients (merged Auth + Firestore via getAll)`);
    res.status(200).json(patients);

  } catch (error) {
    console.error('❌ Error fetching patients:', error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
};

module.exports = { getAllPatients };
