
import React from 'react';
import { Patient, TimelineEvent, CareCoordinatorTask, GlobalChatMessage } from '../../constants';
import ConsultationTimeline from '../doctor/ConsultationTimeline';
import PatientProgressTracker from '../doctor/PatientProgressTracker';
import CareCoordinationCenter from './CaregiverActions';
import CareCoordinatorPatientProfile from './CaregiverPatientProfile';
import MedicalReports from '../doctor/MedicalReports';
import PatientMessagePanel from '../messaging/PatientMessagePanel';
import ConsultationsScreen from '../../screens/dashboard/ConsultationsScreen';

interface CareCoordinatorPatientDetailViewProps {
    patient: Patient;
    tasks: CareCoordinatorTask[];
    onBack: () => void;
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
    onCompleteTask: (taskId: string) => void;
    chatHistory: GlobalChatMessage[];
    onSendMessage: (msg: Omit<GlobalChatMessage, 'id' | 'timestamp'>) => void;
    userName: string;
}

const CareCoordinatorPatientDetailView: React.FC<CareCoordinatorPatientDetailViewProps> = ({ patient, tasks, onBack, onUpdatePatient, onCompleteTask, chatHistory, onSendMessage, userName }) => {
    const [activeSection, setActiveSection] = React.useState<'overview' | 'history' | 'reports' | 'address' | 'consultation_details'>('overview');

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
        { id: 'history', label: 'Patient History', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'reports', label: 'Medical Reports', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { id: 'address', label: 'Patient Address', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { id: 'consultation_details', label: 'Consultation Details', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    ];

    return (
        <div className="animate-fade-in pb-12">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Triage Queue
            </button>

            <header className="mb-8">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <img className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md" src={patient.imageUrl} alt={patient.name} />
                        <div className="absolute bottom-0 right-0 h-5 w-5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{patient.name}</h1>
                        <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md">{patient.age} years old</span>
                            <span>•</span>
                            <span className="text-brand-purple">Goal: {patient.goal}</span>
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Right Side Navigation Menu (Sticky) */}
                <div className="order-1 lg:order-2 lg:col-span-2 space-y-4 lg:sticky lg:top-28">
                    <nav className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        <div className="px-4 py-3 mb-2 border-b border-gray-50">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Patient Navigation</p>
                        </div>
                        <ul className="space-y-1">
                            {menuItems.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setActiveSection(item.id as any)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeSection === item.id
                                            ? 'bg-brand-purple text-white shadow-md shadow-purple-100'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <span className={activeSection === item.id ? 'text-white' : 'text-gray-400'}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Messages Panel always visible on the right */}
                    <PatientMessagePanel
                        patientId={patient.id}
                        chatHistory={chatHistory}
                        onSendMessage={onSendMessage}
                        userName={userName}
                        userRole="careCoordinator"
                        patientName={patient.name}
                        patientImageUrl={patient.imageUrl}
                    />
                </div>

                {/* Main Content Area */}
                <div className="order-2 lg:order-1 lg:col-span-3 space-y-8">
                    {activeSection === 'overview' && (
                        <>
                            <CareCoordinationCenter
                                patient={patient}
                                tasks={tasks}
                                onUpdatePatient={onUpdatePatient}
                                onCompleteTask={onCompleteTask}
                                userName={userName}
                            />
                            <PatientProgressTracker logs={patient.weeklyLogs} />
                        </>
                    )}

                    {activeSection === 'history' && (
                        <ConsultationTimeline
                            patient={patient}
                            timeline={patient.timeline || []}
                            history={patient.patient_history || []}
                            status={patient.status}
                        />
                    )}

                    {activeSection === 'reports' && (
                        <MedicalReports
                            reports={patient.reports}
                            patientId={patient.id}
                            onUpdatePatient={onUpdatePatient}
                        />
                    )}

                    {activeSection === 'address' && (
                        <CareCoordinatorPatientProfile patient={patient} />
                    )}

                    {activeSection === 'consultation_details' && (
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <ConsultationsScreen
                                patient={patient}
                                isDoctorInCall={false}
                                onJoinCall={() => { }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CareCoordinatorPatientDetailView;
