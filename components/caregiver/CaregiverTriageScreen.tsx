
import React from 'react';
import { CareCoordinatorTask, Patient } from '../../constants';
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

const priorityStyles: {[key in CareCoordinatorTask['priority']]: { border: string; }} = {
    'High': { border: 'border-l-4 border-red-500' },
    'Medium': { border: 'border-l-4 border-yellow-400' },
    'Low': { border: 'border-l-4 border-gray-300' },
};

const statusStyles: { [key: string]: string } = {
    'Assessment Review': 'bg-yellow-100 text-yellow-800',
    'Labs Ordered': 'bg-blue-100 text-blue-800',
    'Awaiting Lab Confirmation': 'bg-purple-100 text-purple-800', // Kept for backward compatibility
    'Awaiting Lab Results': 'bg-indigo-100 text-indigo-800', // New status
    'Consultation Scheduled': 'bg-indigo-100 text-indigo-800',
    'Awaiting Shipment': 'bg-orange-100 text-orange-800',
    'Ongoing Treatment': 'bg-green-100 text-green-800',
    'Action Required': 'bg-red-100 text-red-800 animate-pulse',
};


interface CareCoordinatorTriageScreenProps {
    tasks: CareCoordinatorTask[];
    setView: (view: CareCoordinatorView) => void;
    onTaskSelect: (task: CareCoordinatorTask) => void;
}

const CareCoordinatorTriageScreen: React.FC<CareCoordinatorTriageScreenProps> = ({ tasks, setView, onTaskSelect }) => {
    
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    const sortedTasks = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);


    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Triage Queue</h1>
                <p className="mt-1 text-gray-600">Review new patient requests and messages that need your attention.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {sortedTasks.map(task => {
                        const typeStyle = typeStyles[task.type];
                        const priorityStyle = priorityStyles[task.priority];
                        const patientStatusStyle = statusStyles[task.patientStatus] || 'bg-gray-100 text-gray-800';
                        
                        return (
                            <li key={task.id} className={`hover:bg-gray-50 transition-colors ${priorityStyle.border}`}>
                                <button onClick={() => onTaskSelect(task)} className="w-full flex items-center justify-between p-4 text-left">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${typeStyle.bg} flex-shrink-0`}>
                                            {typeStyle.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <p className="font-semibold text-gray-900 truncate">{task.patientName}</p>
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${typeStyle.bg} ${typeStyle.text}`}>{task.type}</span>
                                                 {task.patientId > 0 && <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${patientStatusStyle}`}>{task.patientStatus}</span>}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 truncate">{task.details}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4 ml-4 flex-shrink-0">
                                        <p className="text-sm text-gray-500">{task.timestamp}</p>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    );
};

export default CareCoordinatorTriageScreen;
