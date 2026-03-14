const { admin } = require('../config/firebaseAdmin');
const {
  DoctorDTO,
  CareManagerDTO,
  PatientDetailDTO,
  PatientDirectoryResponseDTO,
  AssignDoctorRequestDTO,
  AssignCareManagerRequestDTO,
  ASSIGNMENT_TYPE,
} = require('../dto/patientDirectoryDTO');

const db = admin.firestore();
const COLLECTION = 'patient_directory';

const getPatientDirectory = async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const authUsers = listUsersResult.users;

    const rolesSnapshot = await db.collection('roles').get();
    const roleMap = {};
    rolesSnapshot.forEach(doc => {
      roleMap[doc.id] = doc.data().role;
    });

    const patientUsers = [];
    const doctorUsers = [];
    const careManagerUsers = [];

    authUsers.forEach(user => {
      const role = roleMap[user.email];
      if (role === 'doctor') doctorUsers.push(user);
      else if (role === 'careCoordinator') careManagerUsers.push(user);
      else if (!role || role === 'patient') patientUsers.push(user);
    });

    const assignmentsSnapshot = await db.collection(COLLECTION).get();
    const assignments = [];
    assignmentsSnapshot.forEach(doc => assignments.push({ id: doc.id, ...doc.data() }));

    const doctorAssignmentCounts = {};
    const careManagerAssignmentCounts = {};
    const patientAssignmentsMap = {};

    assignments.forEach(a => {
      if (!patientAssignmentsMap[a.patient_id]) {
        patientAssignmentsMap[a.patient_id] = { doctors: [], care_managers: [] };
      }
      if (a.type === ASSIGNMENT_TYPE.DOCTOR) {
        patientAssignmentsMap[a.patient_id].doctors.push(a.assigned_id);
        doctorAssignmentCounts[a.assigned_id] = (doctorAssignmentCounts[a.assigned_id] || 0) + 1;
      } else if (a.type === ASSIGNMENT_TYPE.CARE_MANAGER) {
        patientAssignmentsMap[a.patient_id].care_managers.push(a.assigned_id);
        careManagerAssignmentCounts[a.assigned_id] = (careManagerAssignmentCounts[a.assigned_id] || 0) + 1;
      }
    });

    const doctorMap = {};
    doctorUsers.forEach(u => {
      doctorMap[u.uid] = new DoctorDTO({
        doctor_id: u.uid,
        doctor_name: u.displayName || u.email,
        doctor_email: u.email,
        doctor_current_patient_assigned_count: doctorAssignmentCounts[u.uid] || 0,
        doctor_avatar: u.photoURL || '',
      });
    });

    const careManagerMap = {};
    careManagerUsers.forEach(u => {
      careManagerMap[u.uid] = new CareManagerDTO({
        care_manager_id: u.uid,
        care_manager_name: u.displayName || u.email,
        care_manager_email: u.email,
        care_manager_current_patient_assigned_count: careManagerAssignmentCounts[u.uid] || 0,
        care_manager_avatar: u.photoURL || '',
      });
    });

    const profileRefs = patientUsers.map(u =>
      db.collection('users').doc(u.uid).collection('data').doc('profile')
    );

    const profileSnapshots = profileRefs.length > 0 ? await db.getAll(...profileRefs) : [];

    const patient_details = patientUsers.map((user, index) => {
      const profile = profileSnapshots[index]?.exists ? profileSnapshots[index].data() : {};
      const patientAssignments = patientAssignmentsMap[user.uid] || { doctors: [], care_managers: [] };

      const assigned_doctors = patientAssignments.doctors
        .map(id => doctorMap[id])
        .filter(Boolean);

      const assigned_care_managers = patientAssignments.care_managers
        .map(id => careManagerMap[id])
        .filter(Boolean);

      return new PatientDetailDTO({
        patient_id: user.uid,
        patient_name: profile.name || user.displayName || user.email,
        patient_email: profile.email || user.email,
        patient_avatar: profile.photoURL || user.photoURL || '',
        assigned_doctors,
        assigned_care_managers,
      });
    });

    const response = new PatientDirectoryResponseDTO({
      all_doctors_list: Object.values(doctorMap),
      all_care_managers_list: Object.values(careManagerMap),
      patient_details,
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error in getPatientDirectory:', error);
    res.status(500).json({ error: error.message });
  }
};

const assignDoctor = async (req, res) => {
  try {
    const dto = new AssignDoctorRequestDTO(req.body);
    const validationError = dto.validate();
    if (validationError) return res.status(400).json({ error: validationError });

    const { patient_id, assigned_doctors } = dto;
    const newDoctorIds = assigned_doctors.map(d => d.doctor_id);

    const existingSnapshot = await db.collection(COLLECTION)
      .where('patient_id', '==', patient_id)
      .where('type', '==', ASSIGNMENT_TYPE.DOCTOR)
      .get();

    const batch = db.batch();
    existingSnapshot.forEach(doc => batch.delete(doc.ref));

    newDoctorIds.forEach(doctorId => {
      const ref = db.collection(COLLECTION).doc();
      batch.set(ref, {
        patient_id,
        assigned_id: doctorId,
        type: ASSIGNMENT_TYPE.DOCTOR,
        assigned_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('❌ Error in assignDoctor:', error);
    res.status(500).json({ error: error.message });
  }
};

const assignCareManager = async (req, res) => {
  try {
    const dto = new AssignCareManagerRequestDTO(req.body);
    const validationError = dto.validate();
    if (validationError) return res.status(400).json({ error: validationError });

    const { patient_id, assigned_care_managers } = dto;
    const newCareManagerIds = assigned_care_managers.map(cm => cm.care_manager_id);

    const existingSnapshot = await db.collection(COLLECTION)
      .where('patient_id', '==', patient_id)
      .where('type', '==', ASSIGNMENT_TYPE.CARE_MANAGER)
      .get();

    const batch = db.batch();
    existingSnapshot.forEach(doc => batch.delete(doc.ref));

    newCareManagerIds.forEach(careManagerId => {
      const ref = db.collection(COLLECTION).doc();
      batch.set(ref, {
        patient_id,
        assigned_id: careManagerId,
        type: ASSIGNMENT_TYPE.CARE_MANAGER,
        assigned_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('❌ Error in assignCareManager:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getPatientDirectory, assignDoctor, assignCareManager };

