
import React from 'react';
import { CareCoordinatorTask } from '../../constants';
import { CareCoordinatorView } from '../CaregiverDashboard';

const typeStyles: {[key in CareCoordinatorTask['type']]: { icon: string; bg: string; text: string; }} = {
    'New Message': { icon: '💬', bg: 'bg-blue-100', text: 'text-blue-800' },
    'Follow-up Request': { icon: '📞', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'New Consultation': { icon: '✨', bg: 'bg-green-100', text: 'text-green-800' },
    'Lab Coordination': { icon: '🩸', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'Medication Shipment': { icon: '🚚', bg: 'bg-orange-100', text: 'text-orange-800' },
    'Intake Review': { icon: '📋', bg: 'bg-teal-100', text: 'text-teal-800' },
    'Prescription Approval': { icon: '✅', bg: 'bg-purple-100', text: 'text-purple-800' },
    'General Support': { icon: '🤝', bg: 'bg-gray-100', text: 'text-gray-800' }
};

const statusStyles: { [key: string]: string } = {
    'Assessment Review': 'bg-yellow-100 text-yellow-800',
    'Labs Ordered': 'bg-blue-100 text-blue-800',
    'Awaiting Lab Confirmation': 'bg-purple-100 text-purple-800',
    'Awaiting Lab Results': 'bg-indigo-100 text-indigo-800',
    'Consultation Scheduled': 'bg-indigo-100 text-indigo-800',
    'Awaiting Shipment': 'bg-orange-100 text-orange-800',
    'Ongoing Treatment': 'bg-green-100 text-green-800',
    'Action Required': 'bg-red-100 text-red-800 animate-pulse',
};

interface CareCoordinatorTriageScreenProps {
    tasks: CareCoordinatorTask[];
    setView: (view: CareCoordinatorView) => void;
    onPatientSelect: (patientId: number) => void;
}

const CareCoordinatorTriageScreen: React.FC<CareCoordinatorTriageScreenProps> = ({ tasks, setView, onPatientSelect }) => {
    
    // Group tasks by patient
    const tasksByPatient = tasks.reduce((acc, task) => {
        if (!acc[task.patientId]) {
            acc[task.patientId] = [];
        }
        acc[task.patientId].push(task);
        return acc;
    }, {} as Record<number, CareCoordinatorTask[]>);

    // Sort patients by highest priority task
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    const sortedPatientIds = Object.keys(tasksByPatient).map(Number).sort((a, b) => {
        const tasksA = tasksByPatient[a];
        const tasksB = tasksByPatient[b];
        const minPriorityA = Math.min(...tasksA.map(t => priorityOrder[t.priority]));
        const minPriorityB = Math.min(...tasksB.map(t => priorityOrder[t.priority]));
        return minPriorityA - minPriorityB;
    });

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Triage Queue</h1>
                <p className="mt-1 text-gray-600">Review new patient requests and messages that need your attention.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {sortedPatientIds.map(patientId => {
                        const patientTasks = tasksByPatient[patientId];
                        // Sort tasks for this patient by priority
                        patientTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                        
                        const primaryTask = patientTasks[0]; // Highest priority
                        const otherTasksCount = patientTasks.length - 1;
                        const patientStatusStyle = statusStyles[primaryTask.patientStatus] || 'bg-gray-100 text-gray-800';
                        
                        const hasHighPriority = patientTasks.some(t => t.priority === 'High');
                        const borderStyle = hasHighPriority ? 'border-l-4 border-red-500' : 'border-l-4 border-transparent';

                        return (
                            <li key={patientId} className={`hover:bg-gray-50 transition-colors ${borderStyle}`}>
                                <button onClick={() => onPatientSelect(patientId)} className="w-full flex items-center justify-between p-4 text-left">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="relative">
                                            <img src={primaryTask.patientImageUrl} alt={primaryTask.patientName} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                                            {patientTasks.length > 1 && (
                                                <div className="absolute -top-1 -right-1 bg-brand-cyan text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                                    {patientTasks.length}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <p className="font-semibold text-gray-900 truncate">{primaryTask.patientName}</p>
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${patientStatusStyle}`}>{primaryTask.patientStatus}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar">
                                                {patientTasks.map((t, idx) => (
                                                    <span key={t.id} className={`flex-shrink-0 px-2 py-0.5 text-xs rounded border flex items-center gap-1 ${idx === 0 ? 'bg-gray-100 border-gray-300 text-gray-800 font-medium' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                        {typeStyles[t.type]?.icon} {t.type}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4 ml-4 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">{primaryTask.timestamp}</p>
                                            {otherTasksCount > 0 && <p className="text-xs text-brand-purple font-semibold">+{otherTasksCount} more tasks</p>}
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </button>
                            </li>
                        )
                    })}
                    {sortedPatientIds.length === 0 && (
                        <li className="p-8 text-center text-gray-500">No active tasks in queue. Good job! 🎉</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CareCoordinatorTriageScreen;
