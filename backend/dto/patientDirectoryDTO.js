class DoctorDTO {
  constructor({ doctor_id, doctor_name, doctor_email, doctor_current_patient_assigned_count, doctor_avatar }) {
    this.doctor_id = doctor_id;
    this.doctor_name = doctor_name;
    this.doctor_email = doctor_email;
    this.doctor_current_patient_assigned_count = doctor_current_patient_assigned_count;
    this.doctor_avatar = doctor_avatar;
  }
}

class CareManagerDTO {
  constructor({ care_manager_id, care_manager_name, care_manager_email, care_manager_current_patient_assigned_count, care_manager_avatar }) {
    this.care_manager_id = care_manager_id;
    this.care_manager_name = care_manager_name;
    this.care_manager_email = care_manager_email;
    this.care_manager_current_patient_assigned_count = care_manager_current_patient_assigned_count;
    this.care_manager_avatar = care_manager_avatar;
  }
}

class PatientDetailDTO {
  constructor({ patient_id, patient_name, patient_email, patient_avatar, assigned_doctors, assigned_care_managers }) {
    this.patient_id = patient_id;
    this.patient_name = patient_name;
    this.patient_email = patient_email;
    this.patient_avatar = patient_avatar;
    this.assigned_doctors = assigned_doctors;
    this.assigned_care_managers = assigned_care_managers;
  }
}

class PatientDirectoryResponseDTO {
  constructor({ all_doctors_list, all_care_managers_list, patient_details }) {
    this.all_doctors_list = all_doctors_list;
    this.all_care_managers_list = all_care_managers_list;
    this.patient_details = patient_details;
  }
}

class AssignDoctorRequestDTO {
  constructor({ patient_id, assigned_doctors }) {
    this.patient_id = patient_id;
    this.assigned_doctors = assigned_doctors;
  }

  validate() {
    if (!this.patient_id) return 'patient_id is required';
    if (!Array.isArray(this.assigned_doctors)) return 'assigned_doctors must be an array';
    for (const doc of this.assigned_doctors) {
      if (!doc.doctor_id) return 'Each assigned doctor must have a doctor_id';
    }
    return null;
  }
}

class AssignCareManagerRequestDTO {
  constructor({ patient_id, assigned_care_managers }) {
    this.patient_id = patient_id;
    this.assigned_care_managers = assigned_care_managers;
  }

  validate() {
    if (!this.patient_id) return 'patient_id is required';
    if (!Array.isArray(this.assigned_care_managers)) return 'assigned_care_managers must be an array';
    for (const cm of this.assigned_care_managers) {
      if (!cm.care_manager_id) return 'Each assigned care manager must have a care_manager_id';
    }
    return null;
  }
}

const ASSIGNMENT_TYPE = {
  DOCTOR: 'doctor',
  CARE_MANAGER: 'care_manager',
};

module.exports = {
  DoctorDTO,
  CareManagerDTO,
  PatientDetailDTO,
  PatientDirectoryResponseDTO,
  AssignDoctorRequestDTO,
  AssignCareManagerRequestDTO,
  ASSIGNMENT_TYPE,
};

