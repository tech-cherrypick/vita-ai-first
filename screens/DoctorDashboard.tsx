
import React, { useState } from 'react';
import DoctorHeader from '../components/doctor/DoctorHeader';
import PatientList from '../components/doctor/PatientList';
import PatientDetailView from '../components/doctor/PatientDetailView';
import { Patient, mockMessageThreads, TimelineEvent } from '../constants';
import DoctorScheduleScreen from './doctor/DoctorScheduleScreen';
import DoctorMessagesScreen from './doctor/DoctorMessagesScreen';


export type DoctorView = 'patients' | 'schedule' | 'messages';

interface DoctorDashboardProps {
    onSignOut: () => void;
    allPatients: Patient[];
    onUpdatePatient: (patientId: number, newEvent: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onSignOut, allPatients, onUpdatePatient }) => {
    // Store ID instead of object to prevent stale data
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [view, setView] = useState<DoctorView>('patients');
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    // Derive current patient from the fresh prop
    const selectedPatient = allPatients.find(p => p.id === selectedPatientId) || null;

    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatientId(patient.id);
        setView('patients'); // Switch to patient view to show the detail screen
    };

    const handleBackToList = () => {
        setSelectedPatientId(null);
    };

    const handleSendMessage = (patientId: number) => {
        const thread = mockMessageThreads.find(t => t.patientId === patientId);
        if (thread) {
            setActiveThreadId(thread.id);
            setView('messages');
        } else {
            console.warn(`No message thread found for patient ID: ${patientId}`);
            setActiveThreadId(null);
            setView('messages');
        }
    };
    
    const renderContent = () => {
        switch (view) {
            case 'schedule':
                return <DoctorScheduleScreen allPatients={allPatients} onPatientSelect={handlePatientSelect} />;
            case 'messages':
                return <DoctorMessagesScreen initialSelectedThreadId={activeThreadId} />;
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
            <DoctorHeader onSignOut={onSignOut} currentView={view} setView={setView} />
            <main className="py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default DoctorDashboard;
