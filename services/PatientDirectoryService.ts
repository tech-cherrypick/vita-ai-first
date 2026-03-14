import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface DoctorDTO {
  doctor_id: string;
  doctor_name: string;
  doctor_email: string;
  doctor_current_patient_assigned_count: number;
  doctor_avatar: string;
}

export interface CareManagerDTO {
  care_manager_id: string;
  care_manager_name: string;
  care_manager_email: string;
  care_manager_current_patient_assigned_count: number;
  care_manager_avatar: string;
}

export interface PatientDetailDTO {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  patient_avatar: string;
  assigned_doctors: DoctorDTO[];
  assigned_care_managers: CareManagerDTO[];
}

export interface PatientDirectoryResponse {
  all_doctors_list: DoctorDTO[];
  all_care_managers_list: CareManagerDTO[];
  patient_details: PatientDetailDTO[];
}

class PatientDirectoryService {
  private async getToken(): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');
    return token;
  }

  async fetchDirectory(): Promise<PatientDirectoryResponse> {
    const token = await this.getToken();
    const response = await fetch(`${API_BASE_URL}/api/patient-directory`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch patient directory');
    return response.json();
  }

  async assignDoctors(patientId: string, doctorIds: string[]): Promise<void> {
    const token = await this.getToken();
    const response = await fetch(`${API_BASE_URL}/api/patient-directory/assign-doctor`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patient_id: patientId,
        assigned_doctors: doctorIds.map(id => ({ doctor_id: id }))
      })
    });
    if (!response.ok) throw new Error('Failed to assign doctors');
  }

  async assignCareManagers(patientId: string, careManagerIds: string[]): Promise<void> {
    const token = await this.getToken();
    const response = await fetch(`${API_BASE_URL}/api/patient-directory/assign-care-manager`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patient_id: patientId,
        assigned_care_managers: careManagerIds.map(id => ({ care_manager_id: id }))
      })
    });
    if (!response.ok) throw new Error('Failed to assign care managers');
  }
}

export const patientDirectoryService = new PatientDirectoryService();

