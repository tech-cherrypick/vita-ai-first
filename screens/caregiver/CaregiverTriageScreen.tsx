
import React from 'react';
import { CareCoordinatorTask, Patient, CareCoordinatorView } from '../../constants';
const typeStyles: { [key in ('New Message' | 'Follow-up Request' | 'New Consultation' | 'Lab Coordination' | 'Medication Shipment' | 'Intake Review' | 'Prescription Approval' | 'General Support')]: { icon: string; bg: string; text: string; } } = {
    'New Message': { icon: '💬', bg: 'bg-blue-100', text: 'text-blue-800' },
    'Follow-up Request': { icon: '📞', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'New Consultation': { icon: '✨', bg: 'bg-green-100', text: 'text-green-800' },
    'Lab Coordination': { icon: '🩸', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'Medication Shipment': { icon: '🚚', bg: 'bg-orange-100', text: 'text-orange-800' },
    'Intake Review': { icon: '📋', bg: 'bg-teal-100', text: 'text-teal-800' },
    'Prescription Approval': { icon: '✅', bg: 'bg-purple-100', text: 'text-purple-800' },
    'General Support': { icon: '🤝', bg: 'bg-gray-100', text: 'text-gray-800' }
};

const priorityStyles: { [key in CareCoordinatorTask['priority']]: { border: string; } } = {
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

    // Explicit priority order for sorting
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    const sortedTasks = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return (
        <div className="animate-fade-in font-sans">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Triage Queue</h1>
                <p className="mt-2 text-base text-gray-500">Review new patient requests and messages that need your attention.</p>
            </div>

            {/* List Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {sortedTasks.map(task => {
                        // Ananya Iyer (High) has red border.
                        const borderClass = task.priority === 'High' ? 'border-red-500' : 'border-transparent';
                        const patientStatusStyle = statusStyles[task.patientStatus] || 'bg-gray-100 text-gray-700';

                        return (
                            <div key={task.id} className={`group hover:bg-gray-50 transition-colors border-l-[6px] ${borderClass}`}>
                                <button onClick={() => onTaskSelect(task)} className="w-full flex items-center justify-between p-5 text-left">
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        {/* Avatar */}
                                        <div className="relative">
                                            <img
                                                src={task.patientImageUrl || 'https://via.placeholder.com/150'}
                                                alt={task.patientName}
                                                className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Row 1: Name + Status Badge */}
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h3 className="text-base font-bold text-gray-900 truncate">{task.patientName}</h3>
                                                {task.patientStatus && (
                                                    <span className={`px-2.5 py-0.5 inline-flex text-[11px] font-bold rounded-md uppercase tracking-wide ${patientStatusStyle}`}>
                                                        {task.patientStatus}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Row 2: Task Badges (Multiple) */}
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {task.types.map((type, idx) => {
                                                    const typeStyle = typeStyles[type];
                                                    return (
                                                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100/80 text-gray-600 border border-gray-200 text-xs font-semibold">
                                                            <span className="text-sm">{typeStyle?.icon}</span>
                                                            {type}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Time + Chevron */}
                                    <div className="text-right flex items-center gap-6 ml-4 flex-shrink-0">
                                        <span className="text-xs font-medium text-gray-400">{task.timestamp}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        )
                    })}

                    {/* Fallback if no tasks */}
                    {sortedTasks.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No tasks in queue.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CareCoordinatorTriageScreen;
