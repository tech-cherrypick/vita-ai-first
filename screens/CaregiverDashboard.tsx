
import React, { useState } from 'react';
import { Patient, CareCoordinatorTask, TimelineEvent } from '../../constants';
import CareCoordinatorHeader from '../components/caregiver/CaregiverHeader';
import CareCoordinatorTriageScreen from './caregiver/CaregiverTriageScreen';
import CareCoordinatorScheduleScreen from './caregiver/CaregiverScheduleScreen';
import CareCoordinatorMessagesScreen from './caregiver/CaregiverMessagesScreen';
import CareCoordinatorPatientDetailView from '../components/caregiver/CaregiverPatientDetailView';
import { mockCareCoordinatorMessageThreads } from '../constants';


export type CareCoordinatorView = 'triage' | 'schedule' | 'messages';

interface CareCoordinatorDashboardProps {
    onSignOut: () => void;
    allPatients: Patient[];
    onUpdatePatient: (patientId: number, newEvent: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => void;
    tasks: CareCoordinatorTask[];
    onCompleteTask: (taskId: string) => void;
}

const CareCoordinatorDashboard: React.FC<CareCoordinatorDashboardProps> = ({ onSignOut, allPatients, onUpdatePatient, tasks, onCompleteTask }) => {
    const [view, setView] = useState<CareCoordinatorView>('triage');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    const handlePatientSelect = (patientId: number) => {
        const patient = allPatients.find(p => p.id === patientId);
        if (patient) {
            setSelectedPatient(patient);
        } else {
            console.error(`Patient with ID ${patientId} not found.`);
        }
    };
    
    const handleBackToList = () => {
        setSelectedPatient(null);
    };

    const handleSendMessage = (patientId: number) => {
        const thread = mockCareCoordinatorMessageThreads.find(t => t.patientId === patientId);
        if (thread) {
            setActiveThreadId(thread.id);
            setView('messages');
            setSelectedPatient(null); 
        } else {
            console.warn(`No message thread found for patient ID: ${patientId}`);
            setActiveThreadId(null);
            setView('messages');
            setSelectedPatient(null);
        }
    };

    const handleUpdatePatientWrapper = (patientId: number, newEvent: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => {
        onUpdatePatient(patientId, newEvent, updates);
        // Optimistically update local selected patient to reflect changes immediately in UI
        setSelectedPatient(prev => prev ? { ...prev, ...updates } : null);
    };

    const handleTaskCompletion = (taskId: string) => {
        onCompleteTask(taskId);
        // Check if no more tasks for this patient, maybe navigate back?
        // For now, we stay on the view to allow further actions or manual back.
    };

    const renderContent = () => {
        if (selectedPatient) {
            // Filter tasks for the selected patient
            const patientTasks = tasks.filter(t => t.patientId === selectedPatient.id);
            
            return <CareCoordinatorPatientDetailView 
                patient={selectedPatient} 
                tasks={patientTasks}
                onBack={handleBackToList} 
                onUpdatePatient={handleUpdatePatientWrapper} 
                onCompleteTask={handleTaskCompletion}
                onSendMessage={handleSendMessage} 
            />;
        }

        switch (view) {
            case 'schedule':
                return <CareCoordinatorScheduleScreen />;
            case 'messages':
                return <CareCoordinatorMessagesScreen initialSelectedThreadId={activeThreadId} />;
            case 'triage':
            default:
                return <CareCoordinatorTriageScreen tasks={tasks} setView={setView} onPatientSelect={handlePatientSelect} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <CareCoordinatorHeader onSignOut={onSignOut} currentView={view} setView={setView} />
            <main className="py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default CareCoordinatorDashboard;
