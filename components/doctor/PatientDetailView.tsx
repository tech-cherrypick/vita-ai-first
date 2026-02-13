
import React from 'react';
import { Patient, TimelineEvent } from '../../constants';
import MedicalReports from './MedicalReports';
import PatientProgressTracker from './PatientProgressTracker';
import PatientScorecard from './PatientScorecard';
import ClinicalActionCenter from './ClinicalActionCenter';
import DoctorChatAssistant from './DoctorChatAssistant';
import ConsultationTimeline from './ConsultationTimeline';


interface PatientDetailViewProps {
    patient: Patient;
    onBack: () => void;
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => void;
    onSendMessage: (patientId: string | number) => void;
}

const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patient, onBack, onUpdatePatient, onSendMessage }) => {
    return (
        <div className="animate-fade-in relative">
            {/* AI Assistant */}
            <DoctorChatAssistant patient={patient} />

            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Patient List
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
                        className="px-4 py-2 text-sm font-semibold text-white bg-brand-purple rounded-lg hover:opacity-90 shadow-sm">
                        Send Message
                    </button>
                </div>
            </header>

            {/* 1. Unified Action Center - Top */}
            <div className="mb-8">
                <ClinicalActionCenter patient={patient} onUpdatePatient={onUpdatePatient} />
            </div>

            {/* 2. Scorecard Section (Full Width) */}
            <PatientScorecard patient={patient} onUpdatePatient={onUpdatePatient} />

            {/* 3. Split View: History & Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
                {/* Left: Patient Timeline (Contains Process Tracker) */}
                <div className="lg:col-span-2">
                    <ConsultationTimeline
                        patient={patient}
                        timeline={patient.timeline || []}
                        history={patient.patient_history || []}
                        status={patient.status}
                    />
                </div>

                {/* Right: Medical Reports */}
                <div className="space-y-8">
                    <MedicalReports reports={patient.reports} patientId={patient.id} onUpdatePatient={onUpdatePatient} />
                </div>
            </div>

            {/* 4. Progress Tracker (Bottom) */}
            <div className="mb-8">
                <PatientProgressTracker logs={patient.weeklyLogs} />
            </div>
        </div>
    );
};

export default PatientDetailView;
