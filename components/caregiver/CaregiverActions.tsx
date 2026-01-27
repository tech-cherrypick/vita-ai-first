import React, { useState, useEffect } from 'react';
import { Patient, TimelineEvent, CareCoordinatorTask } from '../../constants';

interface CareCoordinationCenterProps {
    patient: Patient;
    tasks: CareCoordinatorTask[];
    onUpdatePatient: (patientId: number, newEvent: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => void;
    onCompleteTask: (taskId: string) => void;
}

// --- 2D Icons ---
const NoteIcon2D = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-400">
        <path d="M14.06 9.02L14.98 9.94L5.92 19H5V18.08L14.06 9.02ZM17.66 3C17.41 3 17.15 3.1 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C18.17 3.09 17.92 3 17.66 3ZM14.06 6.19L3 17.25V21H6.75L17.81 9.94L14.06 6.19Z" />
    </svg>
);

const LabsIcon2D = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-400">
        <path d="M12 22C16.4183 22 20 18.4183 20 14C20 8 12 2 12 2C12 2 4 8 4 14C4 18.4183 7.58172 22 12 22Z" />
    </svg>
);

const ConsultIcon2D = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-400">
        <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8ZM9 14H7V12H9V14ZM13 14H11V12H13V14ZM17 14H15V12H17V14ZM9 18H7V16H9V18ZM13 18H11V16H13V18ZM17 18H15V16H17V18Z" />
    </svg>
);

const FlagIcon2D = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500">
        <path d="M14.4 6L14 4H5V21H7V14H12.6L13 16H20V6H14.4Z" />
    </svg>
);

const SendIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

// --- Active Task Card (Focus) ---
interface ActiveTaskCardProps {
    task: CareCoordinatorTask;
    isLoading: boolean;
    onAction: (data?: any) => void;
}

const ActiveTaskCard: React.FC<ActiveTaskCardProps> = ({ 
    task, 
    isLoading, 
    onAction
}) => {
    const [note, setNote] = useState('');

    const renderContent = () => {
        if (task.type === 'Medication Shipment') {
            return (
                <div className="mt-3">
                    <div className="bg-brand-purple/5 p-3 rounded-lg border border-brand-purple/10 mb-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-brand-purple uppercase">Prescription</span>
                            <span className="text-gray-500">#{task.id.slice(-4)}</span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{task.context?.prescription?.name || 'Medication'}</p>
                        <p className="text-xs text-gray-500">{task.context?.prescription?.dosage}</p>
                    </div>
                    <button 
                        onClick={() => onAction()} 
                        disabled={isLoading}
                        className="w-full py-2.5 bg-brand-cyan text-white text-sm font-bold rounded-lg shadow-md shadow-brand-cyan/20 hover:bg-brand-cyan/90 transition-all flex justify-center items-center gap-2"
                    >
                        {isLoading ? 'Processing...' : 'Confirm Shipment'}
                    </button>
                </div>
            );
        }

        if (task.type === 'New Message' || task.type === 'Follow-up Request') {
            return (
                <div className="mt-3">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-900 mb-3">
                        "{task.details}"
                    </div>
                    <div className="flex gap-2">
                        <input 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Type reply..."
                            className="flex-1 text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-brand-purple"
                        />
                        <button 
                            onClick={() => onAction({ reply: note })}
                            disabled={isLoading || !note.trim()}
                            className="px-3 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90"
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-3">
                <p className="text-xs text-gray-600 mb-3">{task.details}</p>
                <button 
                    onClick={() => onAction()}
                    disabled={isLoading}
                    className="w-full py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800"
                >
                    Mark Complete
                </button>
            </div>
        );
    };

    return (
        <div className="flex gap-4 relative animate-fade-in">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-brand-purple flex items-center justify-center shrink-0 z-10 shadow-md">
                    <div className="w-2 h-2 rounded-full bg-brand-purple animate-pulse"></div>
                </div>
            </div>
            <div className="flex-1">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative top-[-4px]">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-brand-purple uppercase tracking-wider">{task.type}</h4>
                        <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">{task.priority}</span>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const CareCoordinationCenter: React.FC<CareCoordinationCenterProps> = ({ patient, tasks, onUpdatePatient, onCompleteTask }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeAction, setActiveAction] = useState<'labs' | 'consult' | 'note' | 'flag'>('note');
    const [actionNote, setActionNote] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

    // Set initial active task
    useEffect(() => {
        if (tasks.length > 0 && !activeTaskId) {
            // Default to high priority or first
            const highPri = tasks.find(t => t.priority === 'High');
            setActiveTaskId(highPri ? highPri.id : tasks[0].id);
        } else if (tasks.length > 0 && activeTaskId && !tasks.find(t => t.id === activeTaskId)) {
            // If active task was removed, reset
            setActiveTaskId(tasks[0].id);
        } else if (tasks.length === 0) {
            setActiveTaskId(null);
        }
    }, [tasks, activeTaskId]);

    const activeTask = tasks.find(t => t.id === activeTaskId);

    const handleActiveTaskAction = (data?: any) => {
        if (!activeTask) return;
        setIsLoading(true);
        let event: Omit<TimelineEvent, 'id' | 'date'>;
        let updates: Partial<Patient> = {};

        if (activeTask.type === 'Medication Shipment') {
            event = { type: 'Shipment', title: 'Medication Shipped', description: 'Order processed by Care Coordinator.' };
            updates = { status: 'Ongoing Treatment', nextAction: 'Monitoring Check-in' };
        } else if (activeTask.type === 'New Message') {
            event = { type: 'Note', title: 'Message Replied', description: `Coordinator reply: ${data?.reply}` };
            updates = { status: 'Ongoing Treatment' };
        } else {
            event = { type: 'Note', title: 'Task Completed', description: `${activeTask.type} resolved.` };
        }

        setTimeout(() => {
            onUpdatePatient(patient.id, event, updates);
            onCompleteTask(activeTask.id);
            setIsLoading(false);
        }, 1500);
    };

    const submitAction = () => {
        if (!actionNote.trim()) return;
        
        setIsLoading(true);
        let event: Omit<TimelineEvent, 'id' | 'date'>;
        let updates: Partial<Patient> = {};

        if (activeAction === 'labs') {
             event = { type: 'Labs', title: 'Labs Ordered', description: `Coordinator ordered: ${actionNote}` };
             updates = { status: 'Additional Testing Required' };
        } else if (activeAction === 'consult') {
             event = { type: 'Consultation', title: 'Consult Requested', description: `Details: ${actionNote}` };
             updates = { status: 'Follow-up Required' };
        } else if (activeAction === 'flag') {
             event = { type: 'Note', title: 'Issue Flagged', description: `Flagged: ${actionNote}` };
             updates = { status: 'Action Required', nextAction: 'Review Flagged Issue' };
        } else {
             event = { type: 'Note', title: 'Note Added', description: actionNote };
        }
        
        setTimeout(() => {
            onUpdatePatient(patient.id, event, updates);
            setIsLoading(false);
            setActionNote('');
            setSuccessMessage('Action recorded.');
            setTimeout(() => setSuccessMessage(null), 2000);
        }, 800);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="text-lg font-bold text-gray-800">Care Action Center</h2>
                <div className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded ${patient.status === 'Action Required' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {patient.status}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
                <div className="flex gap-4 mb-4">
                    <button onClick={() => setActiveAction('labs')} className={`flex flex-col items-center gap-1 group ${activeAction === 'labs' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <LabsIcon2D />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">Labs</span>
                    </button>
                    <button onClick={() => setActiveAction('consult')} className={`flex flex-col items-center gap-1 group ${activeAction === 'consult' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <ConsultIcon2D />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">Consult</span>
                    </button>
                    <button onClick={() => setActiveAction('note')} className={`flex flex-col items-center gap-1 group ${activeAction === 'note' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <NoteIcon2D />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">Note</span>
                    </button>
                    <button onClick={() => setActiveAction('flag')} className={`flex flex-col items-center gap-1 group ${activeAction === 'flag' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <FlagIcon2D />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">Flag</span>
                    </button>
                </div>

                <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
                    <input 
                        type="text" 
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        placeholder={
                            activeAction === 'note' ? "Add a care note..." :
                            activeAction === 'labs' ? "Labs to coordinate..." :
                            activeAction === 'consult' ? "Reason for consult..." :
                            "Reason for flagging..."
                        }
                        className={`flex-1 p-2 text-sm outline-none bg-transparent ${activeAction === 'flag' ? 'text-red-700 placeholder-red-300' : 'text-gray-700 placeholder-gray-400'}`}
                        onKeyDown={(e) => e.key === 'Enter' && submitAction()}
                    />
                    <button 
                        onClick={submitAction} 
                        disabled={isLoading} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${activeAction === 'flag' ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-cyan hover:bg-brand-cyan/90'}`}
                    >
                        {isLoading ? '...' : (activeAction === 'note' ? 'Save' : activeAction === 'flag' ? 'Flag' : 'Send')}
                    </button>
                </div>
                {successMessage && (
                    <p className="text-[10px] text-green-600 font-bold mt-2 text-center animate-fade-in">{successMessage}</p>
                )}
            </div>

            {/* Tasks Queue */}
            <div className="p-6 bg-white">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex justify-between">
                    <span>Pending Tasks</span>
                    <span className="bg-brand-cyan/10 text-brand-cyan px-2 rounded-full">{tasks.length}</span>
                </h3>
                
                {/* Task Selection Pills */}
                {tasks.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                        {tasks.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTaskId(t.id)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${activeTaskId === t.id ? 'bg-brand-purple text-white border-brand-purple' : 'bg-white text-gray-500 border-gray-200 hover:border-brand-purple/50'}`}
                            >
                                {t.type}
                            </button>
                        ))}
                    </div>
                )}

                {activeTask ? (
                    <ActiveTaskCard 
                        key={activeTask.id}
                        task={activeTask} 
                        isLoading={isLoading} 
                        onAction={handleActiveTaskAction} 
                    />
                ) : (
                    <div className="p-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                        No pending tasks for this patient.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CareCoordinationCenter;