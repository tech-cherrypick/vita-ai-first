import React, { useState, useMemo } from 'react';
import { Patient, TimelineEvent, CareCoordinatorTask } from '../../constants';

interface CareCoordinationCenterProps {
    patient: Patient;
    tasks: CareCoordinatorTask[];
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
    onCompleteTask: (taskId: string) => void;
    userName: string;
}

const CheckIcon = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

// --- Protocol Definitions ---

const ONBOARDING_STEPS = [
    {
        id: 'intake',
        label: 'Intake',
        description: 'Survey completion and lab setup.',
        statuses: ['Action Required'],
        actions: [
            { id: 'complete_intake', label: 'Mark Intake as Completed', targetStatus: 'Assessment Review', targetSection: 'profile' }
        ]
    }
];

const MAINTENANCE_LOOP = [
    {
        id: 'metabolic',
        label: 'Metabolic',
        description: 'Lab analysis and clinical review preparation.',
        statuses: ['Assessment Review', 'Labs Ordered', 'Awaiting Lab Confirmation', 'Awaiting Lab Results', 'Additional Testing Required'],
        actions: [
            { id: 'ongoing_labs', label: 'Mark Labs as Ongoing', targetStatus: 'ongoing', targetSection: 'labs' },
            { id: 'complete_labs', label: 'Mark Labs as Completed', targetStatus: 'completed', targetSection: 'labs' }
        ]
    },
    {
        id: 'clinical',
        label: 'Clinical',
        description: 'Doctor consultation and prescription authorization.',
        statuses: ['Ready for Consult', 'Consultation Scheduled', 'Follow-up Required', 'booked'],
        actions: [
            { id: 'ongoing_consult', label: 'Mark Consultation as Ongoing', targetStatus: 'ongoing', targetSection: 'consultation' },
            { id: 'complete_consult', label: 'Mark Consultation as Completed', targetStatus: 'completed', targetSection: 'consultation' }
        ]
    },
    {
        id: 'pharmacy',
        label: 'Pharmacy',
        description: 'Medication fulfillment.',
        statuses: ['Awaiting Shipment'],
        actions: [
            { id: 'ship_drugs', label: 'Mark Medication as Shipped', targetStatus: 'Shipped', targetSection: 'shipment' },
            { id: 'deliver_drugs', label: 'Mark Medication as Delivered', targetStatus: 'Delivered', targetSection: 'shipment' }
        ]
    },
    {
        id: 'care_loop',
        label: 'Care Loop',
        description: 'Ongoing retention and monitoring.',
        statuses: ['Ongoing Treatment', 'Monitoring Loop'],
        actions: [
            { id: 'setup_care_call', label: 'Log Monthly Follow-up Call', targetStatus: 'completed', targetSection: 'care_loop' }
        ]
    }
];

// --- Main Component ---

const CareCoordinationCenter: React.FC<CareCoordinationCenterProps> = ({ patient, tasks, onUpdatePatient, onCompleteTask, userName }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [actionNote, setActionNote] = useState('');
    const [actionCategory, setActionCategory] = useState<string>('Note');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const currentCycle = patient.currentCycle || 1;
    const physicianName = patient.careTeam?.physician || 'Doctor';

    const protocolSteps = useMemo(() => {
        const steps: any[] = [];
        ONBOARDING_STEPS.forEach((step, idx) => {
            steps.push({
                ...step,
                uniqueId: `onboard_${step.id}`,
                label: `1.${idx + 1} ${step.label}`,
                isCycle: false,
                activeStatuses: currentCycle === 1 ? step.statuses : []
            });
        });

        for (let i = 1; i <= currentCycle; i++) {
            MAINTENANCE_LOOP.forEach((step) => {
                steps.push({
                    ...step,
                    uniqueId: `cycle${i}_${step.id}`,
                    label: `Cycle ${i}: ${step.label}`,
                    isCycle: true,
                    cycleNum: i,
                    activeStatuses: i === currentCycle ? step.statuses : []
                });
            });
        }
        return steps;
    }, [currentCycle]);

    let activeStepIndex = protocolSteps.findIndex(step =>
        step.activeStatuses.some((s: string) => s.toLowerCase() === patient.status?.toLowerCase())
    );

    if (activeStepIndex === -1) {
        const firstStepInCurrentCycle = protocolSteps.findIndex(s => s.isCycle && s.cycleNum === currentCycle);
        activeStepIndex = firstStepInCurrentCycle !== -1 ? firstStepInCurrentCycle : protocolSteps.length - 1;
    }

    const alertTasks = tasks.filter(t => t.priority === 'High' || t.types.includes('New Message'));

    const handleTaskAction = (task: CareCoordinatorTask) => {
        setIsLoading(true);
        let event: Omit<TimelineEvent, 'id' | 'date'>;
        let updates: Partial<Patient> = {};

        if (task.types.includes('Medication Shipment')) {
            event = { type: 'Shipment', title: 'Medication Shipped', description: `Order processed by ${userName}.`, doctor: physicianName };
            updates = {
                status: 'Ongoing Treatment',
                tracking: {
                    ...patient.tracking,
                    shipment: { status: 'Shipped', date: new Date().toISOString(), courier: 'FedEx' }
                }
            };
        } else if (task.types.includes('Lab Coordination')) {
            event = { type: 'Note', title: 'Lab Coordination', description: `Patient contacted regarding labs.`, doctor: physicianName };
            updates = {
                tracking: {
                    ...patient.tracking,
                    labs: { status: 'Coordinated', date: new Date().toISOString() }
                }
            };
        } else {
            event = { type: 'Note', title: 'Task Completed', description: `${task.types.join(', ')} resolved.`, doctor: physicianName };
        }

        setTimeout(() => {
            onUpdatePatient(patient.id, event, updates);
            onCompleteTask(task.id);
            setIsLoading(false);
        }, 1000);
    };

    const handleAddCycle = () => {
        if (!confirm("Start a new treatment cycle?")) return;
        setIsLoading(true);
        const nextCycle = currentCycle + 1;
        const event: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Protocol',
            title: `Cycle ${nextCycle} Started`,
            description: `Care Coordinator initiated new treatment loop.`,
            doctor: physicianName
        };
        const updates: Partial<Patient> = {
            currentCycle: nextCycle,
            status: 'Labs Ordered',
            tracking: {
                ...patient.tracking,
                labs: { status: 'booked', date: new Date().toISOString().split('T')[0] },
                consultation: { status: 'booked' },
                shipment: { status: 'Awaiting' }
            }
        };
        setTimeout(() => {
            onUpdatePatient(patient.id, event, updates);
            setIsLoading(false);
            setSuccessMessage(`Cycle ${nextCycle} started.`);
            setTimeout(() => setSuccessMessage(null), 2000);
        }, 800);
    };

    const toggleAction = (item: any, linkedTask?: CareCoordinatorTask) => {
        const section = item.targetSection;
        const status = item.targetStatus;

        if (confirm(`Update ${section} status to '${status}'?`)) {
            setIsLoading(true);
            let updates: Partial<Patient> = {};
            let event: Omit<TimelineEvent, 'id' | 'date'> | null = null;

            if (section === 'profile') {
                updates = { status: status };
                event = {
                    type: 'Assessment',
                    title: 'Intake Completed',
                    description: `Coordinator marked intake as complete.`,
                    doctor: physicianName
                };
            } else if (['labs', 'consultation', 'shipment'].includes(section)) {
                const currentTracking = patient.tracking || {};
                const currentSectionData = currentTracking[section] || {};
                const updatePayload = { ...currentSectionData, status, updated_at: new Date().toISOString() };

                updates = {
                    tracking: { ...currentTracking, [section]: updatePayload },
                    current_loop: { ...patient.current_loop, [section]: updatePayload }
                };

                if (section === 'labs' && status === 'completed') {
                    updates.status = currentTracking.consultation?.date ? 'Consultation Scheduled' : 'Ready for Consult';
                } else if (section === 'consultation' && status === 'completed') {
                    updates.status = 'Awaiting Shipment';
                } else if (section === 'shipment' && status === 'Shipped') {
                    updates.status = 'Ongoing Treatment';
                } else if (section === 'shipment' && status === 'Delivered') {
                    updates.status = 'Ongoing Treatment';
                }

                // Create history event only for status transitions (prevent duplicates)
                const currentStatus = (currentSectionData.status || '').toLowerCase();
                const newStatusLower = status.toLowerCase();

                // Only log if this is a NEW status (not already set)
                if (currentStatus !== newStatusLower) {
                    if ((section === 'labs' && status === 'completed') ||
                        (section === 'consultation' && status === 'completed') ||
                        (section === 'shipment' && status === 'Shipped') ||
                        (section === 'shipment' && status === 'Delivered')) {
                        event = {
                            type: section === 'labs' ? 'Labs' : section === 'consultation' ? 'Consultation' : 'Shipment',
                            title: section === 'labs' ? 'Lab Results Completed' :
                                section === 'consultation' ? 'Doctor Consultation Completed' :
                                    status === 'Shipped' ? 'Medication Shipped' : 'Medication Delivered',
                            description: section === 'labs' ? 'Patient lab results have been reviewed and finalized.' :
                                section === 'consultation' ? `Metabolic review with ${physicianName} finalized.` :
                                    status === 'Shipped' ? 'Medication has been shipped and is in transit.' :
                                        'The patient has successfully received their prescribed medication.',
                            doctor: physicianName,
                            updater: userName
                        };
                    }
                }
            }

            setTimeout(() => {
                onUpdatePatient(patient.id, event, updates);
                if (linkedTask) onCompleteTask(linkedTask.id);
                setIsLoading(false);
                setSuccessMessage(`${section} updated.`);
                setTimeout(() => setSuccessMessage(null), 2000);
            }, 800);
        }
    };

    const submitQuickLog = () => {
        if (!actionNote.trim()) return;
        setIsLoading(true);
        const event: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Note',
            title: `${actionCategory} Logged`,
            description: actionNote,
            doctor: physicianName,
            updater: userName
        };
        setTimeout(() => {
            onUpdatePatient(patient.id, event, {});
            setIsLoading(false);
            setActionNote('');
            setSuccessMessage('Log saved.');
            setTimeout(() => setSuccessMessage(null), 2000);
        }, 800);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-800">Care Action Center</h2>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200 uppercase tracking-wide">Cycle {currentCycle}</span>
                </div>
                <div className="relative">
                    <select
                        value={patient.status}
                        onChange={(e) => {
                            const newStatus = e.target.value;
                            if (confirm(`Change status to ${newStatus}?`)) {
                                onUpdatePatient(patient.id, null, { status: newStatus as any });
                            }
                        }}
                        className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border border-gray-100 appearance-none cursor-pointer ${patient.status === 'Action Required' ? 'bg-red-50 text-red-600' : 'bg-brand-cyan/10 text-brand-cyan'}`}
                    >
                        {['Assessment Review', 'Labs Ordered', 'Awaiting Lab Results', 'Ready for Consult', 'Consultation Scheduled', 'Awaiting Shipment', 'Ongoing Treatment', 'Action Required'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-gray-50 border-b border-gray-200 p-6">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <textarea
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        placeholder="Log a note..."
                        className="w-full p-2 text-sm outline-none bg-transparent min-h-[40px] resize-none"
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                        <select value={actionCategory} onChange={(e) => setActionCategory(e.target.value)} className="text-xs font-bold text-gray-400 bg-transparent outline-none">
                            <option value="Note">General Note</option>
                            <option value="Call">Call</option>
                            <option value="Lab">Labs</option>
                        </select>
                        <button onClick={submitQuickLog} disabled={isLoading || !actionNote.trim()} className="text-xs font-bold text-white bg-gray-900 px-4 py-1.5 rounded-lg">
                            {isLoading ? 'Saving...' : 'Log Note'}
                        </button>
                    </div>
                </div>
                {successMessage && <p className="text-[10px] text-green-600 font-bold mt-2 text-center">{successMessage}</p>}
            </div>

            <div className="p-6">
                {alertTasks.length > 0 && (
                    <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-100">
                        <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3">Priority Queue</h3>
                        <div className="space-y-3">
                            {alertTasks.map(task => (
                                <div key={task.id} className="bg-white p-3 rounded-lg border border-red-100 flex items-center justify-between">
                                    <div className="text-xs">
                                        <p className="font-bold text-gray-800">{task.types.join(' + ')}</p>
                                        <p className="text-gray-500">{task.detailsList.join(', ')}</p>
                                    </div>
                                    <button onClick={() => handleTaskAction(task)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg whitespace-nowrap">Resolve</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 pl-2">Patient Journey Map</h3>
                <div className="relative pl-6 space-y-0">
                    <div className="absolute left-[31px] top-3 bottom-10 w-0.5 bg-gray-100"></div>
                    {protocolSteps.map((step: any, index: number) => {
                        const isActive = index === activeStepIndex;
                        const isCompleted = index < activeStepIndex;
                        const isPending = index > activeStepIndex;
                        const sectionId = step.id;

                        // DATA-DRIVEN VISIBILITY: Show actions if active, completed, OR has data in sub-sections
                        const hasActiveTask = tasks.some(t =>
                            (sectionId === 'metabolic' && t.types.includes('Lab Coordination')) ||
                            (sectionId === 'clinical' && t.types.includes('New Consultation'))
                        );

                        const trackData = patient.tracking?.[sectionId === 'clinical' ? 'consultation' : (sectionId === 'pharmacy' ? 'shipment' : 'labs')] || {};
                        const loopData = patient.current_loop?.[sectionId === 'clinical' ? 'consultation' : (sectionId === 'pharmacy' ? 'shipment' : 'labs')] || {};
                        const hasData = !!(trackData.status || loopData.status || trackData.date);

                        // PHARMACY CONDITIONAL: Only show pharmacy step if prescription exists
                        const hasPrescription = !!(
                            patient.clinic?.prescription?.name ||
                            patient.tracking?.shipment?.status ||
                            patient.current_loop?.shipment?.status
                        );

                        // Skip rendering pharmacy step if no prescription exists
                        if (sectionId === 'pharmacy' && !hasPrescription) {
                            return null;
                        }

                        return (
                            <div key={step.uniqueId} className={`relative flex gap-6 pb-8 last:pb-8 group ${isActive ? 'opacity-100' : isPending ? 'opacity-50' : 'opacity-80'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all ${isActive ? 'border-brand-cyan text-brand-cyan scale-110 shadow-sm' : isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-gray-300'}`}>
                                    {isCompleted ? <CheckIcon /> : <span className="text-xs font-bold">{index + 1}</span>}
                                </div>

                                <div className="flex-1 pt-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</h4>
                                        {isActive && <span className="text-[9px] font-bold bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded uppercase">Current</span>}
                                    </div>

                                    {(isActive || isCompleted || hasActiveTask || hasData) && (
                                        <div className="mt-4 space-y-2 max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300">
                                            {step.actions.map((action: any) => {
                                                const targetSection = action.targetSection;
                                                const targetStatus = action.targetStatus;

                                                const trackStatus = (patient.tracking?.[targetSection]?.status || '').toLowerCase();
                                                const loopStatus = (patient.current_loop?.[targetSection]?.status || '').toLowerCase();
                                                const currentSubStatus = loopStatus || trackStatus;

                                                let isDone = false;
                                                if (targetSection === 'profile') isDone = patient.status !== 'Action Required';
                                                else if (targetStatus === 'completed' || targetStatus === 'Delivered') {
                                                    // Final status: check if reached
                                                    isDone = currentSubStatus === 'completed' || currentSubStatus === 'delivered';
                                                } else if (targetStatus === 'ongoing' || targetStatus === 'Shipped') {
                                                    // Intermediate status: check if reached OR surpassed
                                                    isDone = currentSubStatus === 'ongoing' || currentSubStatus === 'completed' ||
                                                        currentSubStatus === 'shipped' || currentSubStatus === 'delivered';
                                                }

                                                const linkedTaskForSection = tasks.find(t =>
                                                    (targetSection === 'metabolic' && t.types.includes('Lab Coordination')) ||
                                                    (targetSection === 'clinical' && t.types.includes('New Consultation'))
                                                );

                                                return (
                                                    <div key={action.id} onClick={() => !isDone && toggleAction(action, linkedTaskForSection)} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isDone ? 'bg-gray-50 opacity-60' : 'bg-white border-gray-100 hover:border-brand-cyan/30 hover:bg-brand-cyan/5'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                                                                {isDone && <CheckIcon />}
                                                            </div>
                                                            <span className={`text-xs ${isDone ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>{action.label}</span>
                                                        </div>
                                                        {!isDone && <span className="text-[8px] font-bold text-brand-cyan uppercase">Update</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <button onClick={handleAddCycle} className="mt-4 w-full p-4 rounded-xl border-2 border-dashed border-gray-100 text-gray-400 hover:border-brand-purple/30 hover:bg-brand-purple/5 transition-all">
                        <div className="flex items-center gap-2 justify-center">
                            <PlusIcon /> <span className="text-sm font-bold">Start Cycle {currentCycle + 1}</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CareCoordinationCenter;