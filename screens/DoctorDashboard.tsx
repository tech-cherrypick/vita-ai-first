
import React, { useState, useEffect } from 'react';
import DoctorHeader from '../components/doctor/DoctorHeader';
import PatientList from '../components/doctor/PatientList';
import PatientDetailView from '../components/doctor/PatientDetailView';
import { Patient, TimelineEvent, GlobalChatMessage } from '../constants';
import DoctorScheduleScreen from './doctor/DoctorScheduleScreen';
import DoctorMessagesScreen from './doctor/DoctorMessagesScreen';
import { getSocket } from '../socket';

export type DoctorView = 'patients' | 'schedule' | 'messages';

interface DoctorDashboardProps {
    onSignOut: () => void;
    allPatients: Patient[];
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
    userName: string;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onSignOut, allPatients, onUpdatePatient, userName }) => {
    // Store ID instead of object to prevent stale data
    const [selectedPatientId, setSelectedPatientId] = useState<string | number | null>(null);
    const [view, setView] = useState<DoctorView>('patients');
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [globalChatHistory, setGlobalChatHistory] = useState<GlobalChatMessage[]>([]);
    const socket = getSocket();

    useEffect(() => {
        // 1. Join rooms for all assigned patients
        allPatients.forEach(p => {
            socket.emit('join_room', p.id);
        });

        // 2. Fetch History for all patients
        const fetchAllHistory = async () => {
            if (allPatients.length === 0) return;
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
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
                    setGlobalChatHistory(data);
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

    const handleSendMessage = (patientId: string | number) => {
        // Direct navigation to message thread for this patient
        setActiveThreadId(patientId.toString());
        setView('messages');
    };

    const handleSendChatMessage = (msg: Omit<GlobalChatMessage, 'id' | 'timestamp'>) => {
        const messageData = {
            ...msg,
            patientUid: msg.patientId
        };
        socket.emit('send_message', messageData);
    };

    const renderContent = () => {
        switch (view) {
            case 'schedule':
                return <DoctorScheduleScreen allPatients={allPatients} onPatientSelect={handlePatientSelect} />;
            case 'messages':
                return (
                    <DoctorMessagesScreen
                        initialSelectedThreadId={activeThreadId}
                        chatHistory={globalChatHistory}
                        allPatients={allPatients}
                        onSendMessage={handleSendChatMessage}
                        userName={userName}
                    />
                );
            case 'patients':
            default:
                if (selectedPatient) {
                    return <PatientDetailView patient={selectedPatient} onBack={handleBackToList} onUpdatePatient={onUpdatePatient} onSendMessage={handleSendMessage} />;
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

    return (
        <div className="min-h-screen bg-gray-50">
            <DoctorHeader onSignOut={onSignOut} currentView={view} setView={setView} userName={userName} />
            <main className="py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default DoctorDashboard;
