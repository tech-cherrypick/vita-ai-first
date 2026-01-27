
import React from 'react';
import { Patient, TimelineEvent } from '../../constants';
import MedicalReports from './MedicalReports';
import PatientActions from './PatientActions';
import PatientProgressTracker from './PatientProgressTracker';
import PatientScorecard from './PatientScorecard';
import ClinicalActionCenter from './ClinicalActionCenter';
import DoctorChatAssistant from './DoctorChatAssistant';


interface PatientDetailViewProps {
    patient: Patient;
    onBack: () => void;
    onUpdatePatient: (patientId: number, newEvent: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => void;
    onSendMessage: (patientId: number) => void;
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

            {/* Replaced separate managers with unified Action Center - Moved to top as requested */}
            <div className="mb-8">
                <ClinicalActionCenter patient={patient} onUpdatePatient={onUpdatePatient} />
            </div>

            {/* Scorecard Section with Update capability */}
            <PatientScorecard patient={patient} onUpdatePatient={onUpdatePatient} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* ConsultationTimeline removed as requested */}
                    <PatientProgressTracker logs={patient.weeklyLogs} />
                </div>
                <div className="space-y-8 lg:sticky lg:top-28">
                    <PatientActions patient={patient} onUpdatePatient={onUpdatePatient} />
                    <MedicalReports reports={patient.reports} />
                </div>
            </div>
        </div>
    );
};

export default PatientDetailView;
