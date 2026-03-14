import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Stethoscope,
  HeartHandshake,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
  Loader2
} from 'lucide-react';
import {
  patientDirectoryService,
  type DoctorDTO,
  type CareManagerDTO,
  type PatientDetailDTO,
} from '../../services/PatientDirectoryService';

const DoctorAvatarCluster: React.FC<{ doctors: DoctorDTO[]; color: string }> = ({ doctors, color }) => {
  if (doctors.length === 0) return <span className="text-xs text-gray-400 italic">Unassigned</span>;
  return (
    <div className="flex -space-x-2">
      {doctors.map((doc) =>
        doc.doctor_avatar ? (
          <img key={doc.doctor_id} src={doc.doctor_avatar} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full border-2 border-white object-cover" title={doc.doctor_name} />
        ) : (
          <div key={doc.doctor_id} className={`w-7 h-7 rounded-full ${color} text-white flex items-center justify-center text-[10px] font-bold border-2 border-white`} title={doc.doctor_name}>
            {doc.doctor_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )
      )}
    </div>
  );
};

const CareManagerAvatarCluster: React.FC<{ careManagers: CareManagerDTO[]; color: string }> = ({ careManagers, color }) => {
  if (careManagers.length === 0) return <span className="text-xs text-gray-400 italic">Unassigned</span>;
  return (
    <div className="flex -space-x-2">
      {careManagers.map((cm) =>
        cm.care_manager_avatar ? (
          <img key={cm.care_manager_id} src={cm.care_manager_avatar} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full border-2 border-white object-cover" title={cm.care_manager_name} />
        ) : (
          <div key={cm.care_manager_id} className={`w-7 h-7 rounded-full ${color} text-white flex items-center justify-center text-[10px] font-bold border-2 border-white`} title={cm.care_manager_name}>
            {cm.care_manager_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )
      )}
    </div>
  );
};

const PatientMappingScreen: React.FC = () => {
  const [patients, setPatients] = useState<PatientDetailDTO[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorDTO[]>([]);
  const [allCareManagers, setAllCareManagers] = useState<CareManagerDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [modalPatientId, setModalPatientId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'doctor' | 'careManager'>('doctor');
  const [pendingAssignments, setPendingAssignments] = useState<string[]>([]);

  const fetchDirectory = async () => {
    try {
      setIsLoading(true);
      const data = await patientDirectoryService.fetchDirectory();
      setPatients(data.patient_details);
      setAllDoctors(data.all_doctors_list);
      setAllCareManagers(data.all_care_managers_list);
    } catch (error) {
      console.error('Failed to fetch patient directory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDirectory(); }, []);

  const modalPatient = patients.find(p => p.patient_id === modalPatientId);

  const openModal = (patientId: string, type: 'doctor' | 'careManager') => {
    setModalPatientId(patientId);
    setModalType(type);
    const patient = patients.find(p => p.patient_id === patientId);
    if (patient) {
      setPendingAssignments(
        type === 'doctor'
          ? patient.assigned_doctors.map(d => d.doctor_id)
          : patient.assigned_care_managers.map(cm => cm.care_manager_id)
      );
    }
  };

  const toggleAssignment = (staffId: string) => {
    setPendingAssignments(prev =>
      prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]
    );
  };

  const closeModal = async () => {
    if (!modalPatientId) { setModalPatientId(null); return; }
    try {
      if (modalType === 'doctor') {
        await patientDirectoryService.assignDoctors(modalPatientId, pendingAssignments);
      } else {
        await patientDirectoryService.assignCareManagers(modalPatientId, pendingAssignments);
      }
      await fetchDirectory();
    } catch (error) {
      console.error('Failed to save assignments:', error);
    }
    setModalPatientId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{patients.length}</p><p className="text-xs text-gray-500">Total Patients</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Stethoscope className="w-5 h-5 text-indigo-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{allDoctors.length}</p><p className="text-xs text-gray-500">Doctors</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><HeartHandshake className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{allCareManagers.length}</p><p className="text-xs text-gray-500">Care Managers</p></div>
        </div>
      </div>

      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-gray-900">Patient Directory</h2>
          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500 font-bold">{patients.length} Patients</span>
        </div>

        <div className="hidden md:grid grid-cols-[auto_1fr_140px_140px_32px] items-center gap-4 px-8 py-3 border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
          <div className="w-10" />
          <div>Patient</div>
          <div className="text-center">Doctor</div>
          <div className="text-center">Care Manager</div>
          <div />
        </div>

        <div className="divide-y divide-gray-50">
          {patients.map((patient) => {
            const isExpanded = expandedPatientId === patient.patient_id;

            return (
              <div key={patient.patient_id}>
                <div
                  className="px-8 py-4 grid grid-cols-[auto_1fr_auto_32px] md:grid-cols-[auto_1fr_140px_140px_32px] items-center gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedPatientId(isExpanded ? null : patient.patient_id)}
                >
                  {patient.patient_avatar ? (
                    <img src={patient.patient_avatar} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                      {patient.patient_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{patient.patient_name}</p>
                    <p className="text-xs text-gray-400">{patient.patient_email}</p>
                  </div>

                  <div className="hidden md:flex justify-center">
                    <DoctorAvatarCluster doctors={patient.assigned_doctors} color="bg-indigo-500" />
                  </div>
                  <div className="hidden md:flex justify-center">
                    <CareManagerAvatarCluster careManagers={patient.assigned_care_managers} color="bg-emerald-500" />
                  </div>

                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {isExpanded && (
                  <div className="px-8 pb-5 pt-1 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-gray-700 uppercase">Assigned Doctors</span>
                          </div>
                          <button onClick={() => openModal(patient.patient_id, 'doctor')} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            <UserPlus className="w-3.5 h-3.5" /> Manage
                          </button>
                        </div>
                        {patient.assigned_doctors.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No doctors assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {patient.assigned_doctors.map(doc => (
                              <div key={doc.doctor_id} className="flex items-center gap-2">
                                {doc.doctor_avatar ? (
                                  <img src={doc.doctor_avatar} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">
                                    {doc.doctor_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                )}
                                <span className="text-sm text-gray-700">{doc.doctor_name}</span>
                                <span className="text-[10px] text-gray-400 ml-auto">{doc.doctor_current_patient_assigned_count} patients</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <HeartHandshake className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-700 uppercase">Assigned Care Managers</span>
                          </div>
                          <button onClick={() => openModal(patient.patient_id, 'careManager')} className="text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                            <UserPlus className="w-3.5 h-3.5" /> Manage
                          </button>
                        </div>
                        {patient.assigned_care_managers.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No care managers assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {patient.assigned_care_managers.map(cm => (
                              <div key={cm.care_manager_id} className="flex items-center gap-2">
                                {cm.care_manager_avatar ? (
                                  <img src={cm.care_manager_avatar} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                                    {cm.care_manager_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                )}
                                <span className="text-sm text-gray-700">{cm.care_manager_name}</span>
                                <span className="text-[10px] text-gray-400 ml-auto">{cm.care_manager_current_patient_assigned_count} patients</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {patients.length === 0 && (
            <div className="px-8 py-12 text-center text-gray-400 italic">No patients found.</div>
          )}
        </div>
      </section>

      {modalPatientId && modalPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={closeModal}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {modalType === 'doctor' ? 'Assign Doctors' : 'Assign Care Managers'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">for {modalPatient.patient_name}</p>
              </div>
              <button onClick={() => setModalPatientId(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {modalType === 'doctor' ? allDoctors.map((doc) => {
                const isAssigned = pendingAssignments.includes(doc.doctor_id);
                return (
                  <button
                    key={doc.doctor_id}
                    onClick={() => toggleAssignment(doc.doctor_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${isAssigned ? 'border-brand-purple bg-brand-purple/5' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                  >
                    {doc.doctor_avatar ? (
                      <img src={doc.doctor_avatar} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-indigo-500">
                        {doc.doctor_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{doc.doctor_name}</p>
                      <p className="text-[11px] text-gray-400">{doc.doctor_email} · {doc.doctor_current_patient_assigned_count} patients</p>
                    </div>
                    {isAssigned && <CheckCircle2 className="w-5 h-5 text-brand-purple" />}
                  </button>
                );
              }) : allCareManagers.map((cm) => {
                const isAssigned = pendingAssignments.includes(cm.care_manager_id);
                return (
                  <button
                    key={cm.care_manager_id}
                    onClick={() => toggleAssignment(cm.care_manager_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${isAssigned ? 'border-brand-purple bg-brand-purple/5' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                  >
                    {cm.care_manager_avatar ? (
                      <img src={cm.care_manager_avatar} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-emerald-500">
                        {cm.care_manager_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{cm.care_manager_name}</p>
                      <p className="text-[11px] text-gray-400">{cm.care_manager_email} · {cm.care_manager_current_patient_assigned_count} patients</p>
                    </div>
                    {isAssigned && <CheckCircle2 className="w-5 h-5 text-brand-purple" />}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <button onClick={closeModal} className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-sm transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMappingScreen;

