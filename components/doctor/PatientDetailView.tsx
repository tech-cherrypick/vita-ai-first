
import React from 'react';
import { Patient, TimelineEvent, GlobalChatMessage } from '../../constants';
import MedicalReports from './MedicalReports';
import PatientProgressTracker from './PatientProgressTracker';
import PatientScorecard from './PatientScorecard';
import ClinicalActionCenter from './ClinicalActionCenter';
import DoctorChatAssistant from './DoctorChatAssistant';
import ConsultationTimeline from './ConsultationTimeline';
import PatientMessagePanel from '../messaging/PatientMessagePanel';
import ConsultationDetailsTab from '../dashboard/ConsultationDetailsTab';

interface PatientDetailViewProps {
    patient: Patient;
    onBack: () => void;
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => void;
    chatHistory: GlobalChatMessage[];
    onSendMessage: (msg: Omit<GlobalChatMessage, 'id' | 'timestamp'>) => void;
    userName: string;
}

const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patient, onBack, onUpdatePatient, chatHistory, onSendMessage, userName }) => {
    const [activeRightSection, setActiveRightSection] = React.useState<'messages' | 'reports' | 'progress' | 'consultations'>('messages');

    const rightMenuItems = [
        { id: 'messages', label: 'Messages', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
        { id: 'reports', label: 'Medical Reports', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { id: 'progress', label: 'Weekly Progress', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
        { id: 'consultations', label: 'Consultations', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    ];

    return (
        <div className="animate-fade-in relative pb-12">
            {/* AI Assistant */}
            <DoctorChatAssistant patient={patient} />

            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Patient List
            </button>

            <header className="mb-8">
                <div className="flex items-center gap-5">
                    <img className="h-20 w-20 rounded-full object-cover shadow-sm ring-4 ring-white" src={patient.imageUrl} alt={patient.name} />
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{patient.name}</h1>
                        <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                            <span>{patient.age} years old</span>
                            <span>•</span>
                            <span className="text-brand-purple">Goal: {patient.goal}</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* 1. Unified Action Center - Top */}
            <div className="mb-8">
                <ClinicalActionCenter patient={patient} onUpdatePatient={onUpdatePatient} />
            </div>

            {/* 2. Scorecard Section (Full Width) */}
            <PatientScorecard patient={patient} onUpdatePatient={onUpdatePatient} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Main Content Area (Left/Center) - Reduced width */}
                <div className="lg:col-span-2 space-y-8">
                    <ConsultationTimeline
                        patient={patient}
                        timeline={patient.timeline || []}
                        history={patient.patient_history || []}
                        status={patient.status}
                    />
                </div>

                {/* Right Side Navigation Menu (Sticky) - Increased width */}
                <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-28">
                    <nav className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        <div className="px-4 py-3 mb-2 border-b border-gray-50">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Patient Panel</p>
                        </div>
                        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                            {rightMenuItems.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setActiveRightSection(item.id as any)}
                                        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeRightSection === item.id
                                            ? 'bg-brand-purple text-white shadow-md'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <span className={activeRightSection === item.id ? 'text-white' : 'text-gray-400'}>
                                            {item.icon}
                                        </span>
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Dynamic Content based on selected tab */}
                    <div className="transition-all duration-300">
                        {activeRightSection === 'messages' && (
                            <PatientMessagePanel
                                patientId={patient.id}
                                chatHistory={chatHistory}
                                onSendMessage={onSendMessage}
                                userName={userName}
                                userRole="doctor"
                                patientName={patient.name}
                                patientImageUrl={patient.imageUrl}
                            />
                        )}
                        {activeRightSection === 'reports' && (
                            <MedicalReports reports={patient.reports} patientId={patient.id} onUpdatePatient={onUpdatePatient} />
                        )}
                        {activeRightSection === 'progress' && (
                            <PatientProgressTracker logs={patient.weeklyLogs} />
                        )}
                        {activeRightSection === 'consultations' && (
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Past Sessions</h3>
                                <ConsultationDetailsTab patient={patient} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailView;
