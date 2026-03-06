
import React, { useState, useEffect, useCallback } from 'react';
import DoctorHeader from '../components/doctor/DoctorHeader';
import PatientList from '../components/doctor/PatientList';
import PatientDetailView from '../components/doctor/PatientDetailView';
import { Patient, TimelineEvent, GlobalChatMessage } from '../constants';
import DoctorScheduleScreen from './doctor/DoctorScheduleScreen';
import { getSocket } from '../socket';
import ConsultationCall from '../components/dashboard/ConsultationCall';
import { useAndroidBackButton } from '../hooks/useAndroidBackButton';

export type DoctorView = 'patients' | 'schedule';

interface DoctorDashboardProps {
    onSignOut: () => void;
    allPatients: Patient[];
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
    userName: string;
}

const ModalWrapper: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode, maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`bg-white w-full ${maxWidth} rounded-3xl shadow-2xl overflow-hidden relative flex flex-col animate-slide-in-up max-h-[95vh]`}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-black text-xl text-gray-900 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2.5 hover:bg-gray-200 rounded-full transition-all hover:rotate-90">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-8 overflow-y-auto bg-white flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onSignOut, allPatients, onUpdatePatient, userName }) => {
    // Store ID instead of object to prevent stale data
    const [selectedPatientId, setSelectedPatientId] = useState<string | number | null>(null);
    const [view, setView] = useState<DoctorView>('patients');
    const [globalChatHistory, setGlobalChatHistory] = useState<GlobalChatMessage[]>([]);
    const [activeCallPatientId, setActiveCallPatientId] = useState<string | null>(null);
    const socket = getSocket();

    useAndroidBackButton(useCallback(() => {
        if (activeCallPatientId) {
            setActiveCallPatientId(null);
            return true;
        }
        if (selectedPatientId) {
            setSelectedPatientId(null);
            return true;
        }
        if (view !== 'patients') {
            setView('patients');
            return true;
        }
        return false;
    }, [activeCallPatientId, selectedPatientId, view]));

    useEffect(() => {
        // 1. Join rooms for all assigned patients
        allPatients.forEach(p => {
            socket.emit('join_room', p.id);
        });

        // 2. Fetch History for all patients
        const fetchAllHistory = async () => {
            if (allPatients.length === 0) return;
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            try {
                const response = await fetch(`${API_BASE_URL}/api/doctor/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ patientIds: allPatients.map(p => p.id) })
                });
                if (response.ok) {
                    const data = await response.json();
                    const mappedData = data.map((msg: GlobalChatMessage) => {
                        const isTimestampDate = msg.timestamp && !isNaN(new Date(msg.timestamp).getTime());
                        return {
                            ...msg,
                            createdAt: msg.createdAt || (isTimestampDate ? msg.timestamp : undefined)
                        };
                    });
                    setGlobalChatHistory(mappedData);
                }
            } catch (err) {
                console.error('Failed to fetch global chat history', err);
            }
        };
        fetchAllHistory();

        // 3. Listen for messages
        const handleMessage = (msg: GlobalChatMessage) => {
            setGlobalChatHistory(prev => {
                // Prevent duplicates
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };

        socket.on('receive_message', handleMessage);

        return () => {
            socket.off('receive_message', handleMessage);
        };
    }, [allPatients, socket]);

    // Derive current patient from the fresh prop
    const selectedPatient = allPatients.find(p => p.id === selectedPatientId) || null;

    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatientId(patient.id);
        setView('patients'); // Switch to patient view to show the detail screen
    };

    const handleBackToList = () => {
        setSelectedPatientId(null);
    };

    const handleSendChatMessage = (msg: Omit<GlobalChatMessage, 'id' | 'timestamp'>) => {
        const messageData = {
            ...msg,
            patientUid: msg.patientId
        };
        socket.emit('send_message', messageData);
    };

    const handleJoinCall = (patientId: string) => {
        setActiveCallPatientId(patientId);
        // Signaling: Inform the patient that the doctor is joining
        socket.emit('initiate_call', { patientId, doctorName: userName, doctorId: 'doctor' });
    };

    const handleCallEnd = (data?: { transcript: string; summary: string }) => {
        if (activeCallPatientId && data) {
            // Update patient timeline with the summary
            onUpdatePatient(activeCallPatientId, {
                type: 'Consultation',
                title: 'Consultation Summary Generated',
                description: data.summary,
                doctor: userName,
                context: { transcript: data.transcript, summary: data.summary }
            }, { status: 'Awaiting Shipment' });
        }
        setActiveCallPatientId(null);
    };

    const renderContent = () => {
        switch (view) {
            case 'schedule':
                return <DoctorScheduleScreen allPatients={allPatients} onPatientSelect={handlePatientSelect} onJoinCall={handleJoinCall} />;
            case 'patients':
            default:
                if (selectedPatient) {
                    return <PatientDetailView patient={selectedPatient} onBack={handleBackToList} onUpdatePatient={onUpdatePatient} chatHistory={globalChatHistory} onSendMessage={handleSendChatMessage} userName={userName} />;
                }
                return (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Patient Overview</h1>
                            <p className="mt-1 text-gray-600">Review patient statuses and pending actions.</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <PatientList patients={allPatients} onPatientSelect={handlePatientSelect} />
                        </div>
                    </>
                );
        }
    };

    const activeCallPatient = allPatients.find(p => p.id === activeCallPatientId);

    return (
        <div className="min-h-screen bg-gray-50">
            <DoctorHeader onSignOut={onSignOut} currentView={view} setView={setView} userName={userName} />
            <main className="py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {renderContent()}
                </div>
            </main>

            {/* Video Call Modal */}
            <ModalWrapper
                isOpen={!!activeCallPatientId}
                onClose={() => handleCallEnd()}
                title={`Consultation with ${activeCallPatient?.name || 'Patient'}`}
            >
                {activeCallPatientId && (
                    <ConsultationCall
                        patientId={activeCallPatientId}
                        otherPartyName={activeCallPatient?.name || 'Patient'}
                        role="doctor"
                        onCallEnd={handleCallEnd}
                    />
                )}
            </ModalWrapper>
        </div>
    );
};

export default DoctorDashboard;
