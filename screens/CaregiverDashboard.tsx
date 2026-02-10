
import React, { useState } from 'react';
import { Patient, CareCoordinatorTask, TimelineEvent, CareCoordinatorView, mockCareCoordinatorMessageThreads, GlobalChatMessage } from '../constants';
import CareCoordinatorHeader from '../components/caregiver/CaregiverHeader';
import CareCoordinatorTriageScreen from './caregiver/CaregiverTriageScreen';
import CareCoordinatorScheduleScreen from './caregiver/CaregiverScheduleScreen';
import CareCoordinatorMessagesScreen from './caregiver/CaregiverMessagesScreen';
import CareCoordinatorPatientDetailView from '../components/caregiver/CaregiverPatientDetailView';
import PatientList from '../components/doctor/PatientList';

interface CareCoordinatorDashboardProps {
    onSignOut: () => void;
    allPatients: Patient[];
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
    tasks: CareCoordinatorTask[];
    onCompleteTask: (taskId: string) => void;
    userName: string;
}

const CareCoordinatorDashboard: React.FC<CareCoordinatorDashboardProps> = ({ onSignOut, allPatients, onUpdatePatient, tasks, onCompleteTask, userName }) => {
    const [view, setView] = useState<CareCoordinatorView>('triage');
    const [selectedPatientId, setSelectedPatientId] = useState<string | number | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [globalChatHistory, setGlobalChatHistory] = useState<GlobalChatMessage[]>([]);

    // Derive current patient from the fresh prop
    const selectedPatient = allPatients.find(p => String(p.id) === String(selectedPatientId)) || null;

    // Derive tasks from allPatients (Real Backend Data) - Grouped by Patient
    const tasksMap = new Map<string | number, CareCoordinatorTask>();

    allPatients.forEach(patient => {
        const tracking = patient.tracking || {};
        const labs = tracking.labs || {};
        const consult = tracking.consultation || {};

        const getGroupedTask = (patient: Patient): CareCoordinatorTask => {
            if (!tasksMap.has(patient.id)) {
                tasksMap.set(patient.id, {
                    id: `patient_${patient.id}`,
                    patientId: patient.id,
                    patientName: patient.name,
                    patientImageUrl: patient.imageUrl || patient.photoURL || 'https://via.placeholder.com/150',
                    types: [],
                    detailsList: [],
                    patientStatus: patient.status,
                    priority: 'Low',
                    timestamp: 'Pending',
                    context: patient
                } as CareCoordinatorTask);
            }
            return tasksMap.get(patient.id)!;
        };

        // 1. Lab Coordination Task
        if (labs.date && labs.status !== 'completed') {
            const task = getGroupedTask(patient);
            task.types.push('Lab Coordination');
            task.detailsList.push(labs.status === 'booked' ? 'Confirm Lab Appointment' : 'Review Lab Progress');
            if (patient.status === 'Action Required') task.priority = 'High';
            else if (task.priority !== 'High') task.priority = 'Medium';
            task.timestamp = `${labs.date} ${labs.time || ''}`;
        }

        // 2. Consultation Coordination Task
        if (consult.date && consult.status !== 'completed') {
            const task = getGroupedTask(patient);
            task.types.push('New Consultation');
            task.detailsList.push(consult.status === 'booked' ? 'Schedule Doctor Consultation' : 'Pre-call prep required');
            if (patient.status === 'Action Required') task.priority = 'High';
            else if (task.priority !== 'High') task.priority = 'Medium';
            task.timestamp = `${consult.date} ${consult.time || ''}`;
        }

        // 3. Digital Intake Task
        const intakeComplete = patient.status !== 'Action Required' && (patient.psych && Object.keys(patient.psych).length > 0);
        if (!intakeComplete) {
            const task = getGroupedTask(patient);
            task.types.push('Intake Review');
            task.detailsList.push('Missing Digital Intake Assessment');
            task.priority = 'High';
            // Keep timestamp if already set by labs/consult, otherwise 'Pending'
        }

        // 4. Medication Shipment Task (Real Data Mode)
        const shipment = tracking.shipment || {};
        const rx = patient.clinic?.prescription || (shipment.status === 'Awaiting Shipment' ? shipment : null);

        if (rx && shipment.status !== 'Delivered' && shipment.status) {
            const task = getGroupedTask(patient);
            task.types.push('Medication Shipment');
            task.detailsList.push(shipment.status === 'Shipped' ? 'Track Delivery' : `Fulfill Rx: ${rx.name || 'Prescription'}`);

            if (shipment.status === 'Awaiting Shipment' || shipment.status === 'Awaiting') {
                task.priority = 'High';
            } else if (task.priority !== 'High') {
                task.priority = 'Medium';
            }

            if (shipment.updated_at) {
                task.timestamp = typeof shipment.updated_at === 'string'
                    ? new Date(shipment.updated_at).toLocaleDateString()
                    : new Date(shipment.updated_at._seconds * 1000).toLocaleDateString();
            }
        }
    });

    const derivedTasks = Array.from(tasksMap.values());
    const tasksToDisplay = derivedTasks; // Strict Real Data Mode

    const handlePatientSelect = (patientId: string | number) => {
        setSelectedPatientId(patientId);
    };

    const handleBackToList = () => {
        setSelectedPatientId(null);
    };

    const handleSendMessage = (patientId: string | number) => {
        const thread = mockCareCoordinatorMessageThreads.find(t => String(t.patientId) === String(patientId));
        if (thread) {
            setActiveThreadId(thread.id);
            setView('messages');
            setSelectedPatientId(null);
        } else {
            console.warn(`No message thread found for patient ID: ${patientId}`);
            setActiveThreadId(null);
            setView('messages');
            setSelectedPatientId(null);
        }
    };

    const handleSendChatMessage = (msg: Omit<GlobalChatMessage, 'id' | 'timestamp'>) => {
        const newMsg: GlobalChatMessage = {
            ...msg,
            id: `msg_${Date.now()}`,
            timestamp: new Date().toISOString()
        };
        setGlobalChatHistory(prev => [...prev, newMsg]);
    };

    const handleUpdatePatientWrapper = (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient> = {}) => {
        onUpdatePatient(patientId, newEvent, updates);
        // No longer need to manually update selectedPatient as it's derived from allPatients prop
    };

    const handleTaskCompletion = (taskId: string) => {
        onCompleteTask(taskId);
        // Check if no more tasks for this patient, maybe navigate back?
        // For now, we stay on the view to allow further actions or manual back.
    };

    const renderContent = () => {
        if (selectedPatient) {
            // Filter tasks for the selected patient
            const patientTasks = derivedTasks.filter(t => t.patientId === selectedPatient.id);

            return <CareCoordinatorPatientDetailView
                patient={selectedPatient}
                tasks={patientTasks}
                onBack={handleBackToList}
                onUpdatePatient={handleUpdatePatientWrapper}
                onCompleteTask={handleTaskCompletion}
                onSendMessage={handleSendMessage}
                userName={userName}
            />;
        }

        switch (view) {
            case 'schedule':
                return <CareCoordinatorScheduleScreen />;
            case 'messages':
                return (
                    <CareCoordinatorMessagesScreen
                        initialSelectedThreadId={activeThreadId}
                        chatHistory={globalChatHistory}
                        allPatients={allPatients}
                        onSendMessage={handleSendChatMessage}
                    />
                );
            case 'patients':
                return (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">All Patients ({allPatients.length})</h2>
                        </div>
                        <PatientList
                            patients={allPatients}
                            onPatientSelect={(patient) => handlePatientSelect(patient.id)}
                        />
                    </div>
                );
            case 'triage':
            default:
                return <CareCoordinatorTriageScreen
                    tasks={derivedTasks}
                    setView={setView}
                    onTaskSelect={(task) => handlePatientSelect(task.patientId)}
                />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <CareCoordinatorHeader onSignOut={onSignOut} currentView={view} setView={setView} userName={userName} />
            <main className="py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default CareCoordinatorDashboard;
