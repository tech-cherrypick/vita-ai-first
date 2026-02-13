
import React from 'react';
import { Patient, TimelineEvent, CareCoordinatorTask } from '../../constants';
import ConsultationTimeline from '../doctor/ConsultationTimeline';
import PatientProgressTracker from '../doctor/PatientProgressTracker';
import CareCoordinationCenter from './CaregiverActions';
import CareCoordinatorPatientProfile from './CaregiverPatientProfile';
import MedicalReports from '../doctor/MedicalReports';

interface CareCoordinatorPatientDetailViewProps {
    patient: Patient;
    tasks: CareCoordinatorTask[];
    onBack: () => void;
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
    onCompleteTask: (taskId: string) => void;
    onSendMessage: (patientId: string | number) => void;
    userName: string;
}

const CareCoordinatorPatientDetailView: React.FC<CareCoordinatorPatientDetailViewProps> = ({ patient, tasks, onBack, onUpdatePatient, onCompleteTask, onSendMessage, userName }) => {
    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Triage Queue
            </button>

            <header className="mb-8">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                        <img className="h-20 w-20 rounded-full object-cover" src={patient.imageUrl} alt={patient.name} />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
                            <p className="text-gray-600 mt-1">{patient.age} years old • Goal: {patient.goal}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onSendMessage(patient.id)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-brand-cyan rounded-lg hover:opacity-90 shadow-sm">
                        View Messages
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Content: Action Center, Timeline & Progress */}
                <div className="lg:col-span-2 space-y-8">
                    {/* The Unified Care Coordination Center - Key Action Piece */}
                    <CareCoordinationCenter
                        patient={patient}
                        tasks={tasks}
                        onUpdatePatient={onUpdatePatient}
                        onCompleteTask={onCompleteTask}
                        userName={userName}
                    />

                    <ConsultationTimeline
                        patient={patient}
                        timeline={patient.timeline || []}
                        history={patient.patient_history || []}
                        status={patient.status}
                    />
                    <PatientProgressTracker logs={patient.weeklyLogs} />
                </div>

                {/* Sidebar: Profile & Info */}
                <div className="space-y-6 lg:sticky lg:top-28">
                    <CareCoordinatorPatientProfile patient={patient} />

                    {/* Shared Medical Reports Module */}
                    <MedicalReports
                        reports={patient.reports}
                        patientId={patient.id}
                        onUpdatePatient={onUpdatePatient}
                    />
                </div>
            </div>
        </div>
    );
};

export default CareCoordinatorPatientDetailView;
