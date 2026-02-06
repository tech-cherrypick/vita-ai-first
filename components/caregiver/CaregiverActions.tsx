
import React, { useState, useMemo } from 'react';
import { Patient, TimelineEvent, CareCoordinatorTask } from '../../constants';

interface CareCoordinationCenterProps {
    patient: Patient;
    tasks: CareCoordinatorTask[];
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
    onCompleteTask: (taskId: string) => void;
    userName: string;
}

const SendIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const CheckIcon = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

// --- Protocol Definitions ---

const ONBOARDING_STEPS = [
    {
        id: 'intake',
        label: 'Intake',
        description: 'Survey completion and lab setup.',
        statuses: ['Assessment Review', 'Action Required'],
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
        statuses: ['Labs Ordered', 'Awaiting Lab Confirmation', 'Awaiting Lab Results', 'Additional Testing Required'],
        actions: [
            { id: 'ongoing_labs', label: 'Mark Labs as Ongoing', targetStatus: 'ongoing', targetSection: 'labs' },
            { id: 'complete_labs', label: 'Mark Labs as Completed', targetStatus: 'completed', targetSection: 'labs' }
        ]
    },
    {
        id: 'clinical',
        label: 'Clinical',
        description: 'Doctor consultation and prescription authorization.',
        statuses: ['Ready for Consult', 'Consultation Scheduled', 'Follow-up Required'],
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
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

    // 1. Determine Cycle Count (Default to 1 if not set)
    const currentCycle = patient.currentCycle || 1;
    const hasPrescription = !!patient.clinic?.prescription;

    // 2. Dynamically construct the full protocol based on cycles
    const protocolSteps = useMemo(() => {
        const steps = [];

        // Add Onboarding (Only happens once at the start)
        ONBOARDING_STEPS.forEach((step, idx) => {
            steps.push({
                ...step,
                uniqueId: `onboard_${step.id}`,
                label: `1.${idx + 1} ${step.label}`,
                isCycle: false,
                // Onboarding statuses only apply if we are in cycle 1 (or 0)
                activeStatuses: currentCycle === 1 ? step.statuses : []
            });
        });

        // Add Cycles
        for (let i = 1; i <= currentCycle; i++) {
            MAINTENANCE_LOOP.forEach((step, idx) => {
                steps.push({
                    ...step,
                    uniqueId: `cycle${i}_${step.id}`,
                    label: `Cycle ${i}: ${step.label}`, // e.g. "Cycle 1: Clinical", "Cycle 2: Pharmacy"
                    isCycle: true,
                    cycleNum: i,
                    // Statuses only match for the CURRENT cycle
                    activeStatuses: i === currentCycle ? step.statuses : []
                });
            });
        }
        return steps;
    }, [currentCycle]);

    // 3. Determine Active Step Index
    // We look for the FIRST step that matches the current patient status.
    // If patient is in a later cycle, previous cycle steps don't match because their 'activeStatuses' is empty.
    let activeStepIndex = protocolSteps.findIndex(step => step.activeStatuses.includes(patient.status));

    // Fallback: If no status matches (e.g. status is weird), default to the last step of the current cycle
    if (activeStepIndex === -1) {
        // Default to the last step added (likely Care Loop of current cycle)
        activeStepIndex = protocolSteps.length - 1;
    }

    // Filter ad-hoc alerts (High priority or messages) from standard flow tasks
    const alertTasks = tasks.filter(t => t.priority === 'High' || t.types.includes('New Message'));

    const handleTaskAction = (task: CareCoordinatorTask, note?: string) => {
        setIsLoading(true);
        let event: Omit<TimelineEvent, 'id' | 'date'>;
        let updates: Partial<Patient> = {};

        if (task.types.includes('Medication Shipment')) {
            event = { type: 'Shipment', title: 'Medication Shipped', description: 'Order processed by Care Coordinator.', doctor: userName };
            updates = {
                status: 'Ongoing Treatment',
                nextAction: 'Monitoring Check-in',
                tracking: {
                    ...patient.tracking,
                    shipment: { status: 'Shipped', date: new Date().toISOString(), courier: 'FedEx' }
                }
            };
        } else if (task.types.includes('New Message')) {
            event = { type: 'Note', title: 'Message Replied', description: `Coordinator reply: ${note || 'Resolved'}`, doctor: userName };
            updates = { status: 'Ongoing Treatment' };
        } else if (task.types.includes('Lab Coordination')) {
            event = { type: 'Note', title: 'Lab Coordination', description: 'Patient contacted regarding labs.', doctor: userName };
            updates = {
                tracking: {
                    ...patient.tracking,
                    labs: { status: 'Coordinated', date: new Date().toISOString() }
                }
            };
        } else {
            event = { type: 'Note', title: 'Task Completed', description: `${task.types.join(', ')} resolved.`, doctor: userName };
        }

        setTimeout(() => {
            onUpdatePatient(patient.id, event, updates);
            onCompleteTask(task.id);
            setIsLoading(false);
        }, 1000);
    };

    const handleAddCycle = () => {
        if (!confirm("Start a new treatment cycle? This will advance the protocol to the next 'Metabolic' phase for lab work.")) return;

        setIsLoading(true);
        const nextCycle = currentCycle + 1;

        const event: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Protocol',
            title: `Cycle ${nextCycle} Started`,
            description: 'Care Coordinator initiated new treatment loop. Labs ordered.',
            doctor: userName
        };

        const updates: Partial<Patient> = {
            currentCycle: nextCycle,
            status: 'Labs Ordered', // Reset status to start of loop (Metabolic)
            nextAction: 'Coordinate Lab Visit',
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
        const uid = String(patient.id);
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
                    description: 'Care Coordinator marked patient intake as complete.',
                    doctor: userName
                };
            } else if (['labs', 'consultation', 'shipment'].includes(section)) {
                // Ensure safe access to existing tracking data
                const currentTracking = patient.tracking || {};
                const currentSectionData = currentTracking[section] || {};

                updates = {
                    tracking: {
                        ...currentTracking,
                        [section]: {
                            ...currentSectionData,
                            status: status,
                            updated_at: new Date().toISOString(),
                            // Format: "5 February 2026 at 11:38:07 UTC+5:30"
                            migrated_at: new Date().toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                second: 'numeric',
                                hour12: false
                            }) + " UTC+5:30"
                        }
                    }
                };

                // Generate a more specific event type if possible
                const eventType = section === 'labs' ? 'Labs' : (section === 'consultation' ? 'Consultation' : (section === 'shipment' ? 'Shipment' : 'Note'));

                event = {
                    type: eventType as any,
                    title: `${section.charAt(0).toUpperCase() + section.slice(1)} Updated`,
                    description: `Care Coordinator moved ${section} to ${status}.`,
                    doctor: userName
                };

                // Move Patient Status if pharmacy/shipment is completed
                if (section === 'shipment' && status === 'Delivered') {
                    updates.status = 'Ongoing Treatment';
                }
            }

            setTimeout(() => {
                console.log(`📤 [CaregiverActions] Sending update for ${section}:`, { updates, event });
                onUpdatePatient(patient.id, event, updates);
                if (linkedTask) onCompleteTask(linkedTask.id);
                setIsLoading(false);
                setSuccessMessage(`${section} status updated to ${status}.`);
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
            doctor: userName
        };
        setTimeout(() => {
            onUpdatePatient(patient.id, event, {});
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
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-800">Care Action Center</h2>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200 uppercase tracking-wide">
                        Cycle {currentCycle}
                    </span>
                </div>
                <div className="relative">
                    <select
                        value={patient.status}
                        onChange={(e) => {
                            const newStatus = e.target.value;
                            if (confirm(`Manual Override: Change patient status to ${newStatus}?`)) {
                                onUpdatePatient(patient.id, {
                                    type: 'Note',
                                    title: 'Status Override',
                                    description: `Status manually changed to ${newStatus} by Care Coordinator.`,
                                    doctor: userName
                                }, { status: newStatus as any });
                            }
                        }}
                        className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border-none outline-none appearance-none cursor-pointer transition-all ${patient.status === 'Action Required' ? 'bg-red-100 text-red-700' : 'bg-brand-cyan/10 text-brand-cyan'}`}
                    >
                        {[
                            'Assessment Review', 'Labs Ordered', 'Awaiting Lab Confirmation',
                            'Awaiting Lab Results', 'Ready for Consult', 'Consultation Scheduled',
                            'Follow-up Required', 'Awaiting Shipment', 'Ongoing Treatment',
                            'Monitoring Loop', 'Action Required', 'Additional Testing Required'
                        ].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Quick Log Area */}
            <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-6">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-brand-cyan/20">
                    <textarea
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        placeholder="Log a quick note, call summary, or offline action..."
                        className="w-full p-2 text-sm outline-none bg-transparent min-h-[40px] resize-none text-gray-700 placeholder-gray-400"
                        rows={1}
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                        <select
                            value={actionCategory}
                            onChange={(e) => setActionCategory(e.target.value)}
                            className="text-xs font-bold text-gray-500 bg-transparent outline-none cursor-pointer hover:text-brand-purple transition-colors"
                        >
                            <option value="Note">General Note</option>
                            <option value="Call">Call / Consult</option>
                            <option value="Lab">Lab Coordination</option>
                            <option value="Logistics">Logistics</option>
                        </select>
                        <button
                            onClick={submitQuickLog}
                            disabled={isLoading || !actionNote.trim()}
                            className="text-xs font-bold text-white bg-gray-900 px-4 py-1.5 rounded-lg hover:bg-black transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Log Note'}
                        </button>
                    </div>
                </div>
                {successMessage && <p className="text-[10px] text-green-600 font-bold mt-2 text-center animate-fade-in">{successMessage}</p>}
            </div>

            <div className="p-6 bg-white">

                {/* 1. Priority Alerts Section */}
                {alertTasks.length > 0 && (
                    <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-100">
                        <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Priority Queue
                        </h3>
                        <div className="space-y-3">
                            {alertTasks.map(task => (
                                <div key={task.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{task.types.join(' + ')}</p>
                                        <p className="text-[11px] text-gray-500">{task.detailsList.join(', ')}</p>
                                    </div>
                                    <button
                                        onClick={() => handleTaskAction(task)}
                                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                                    >
                                        Resolve
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Dynamic Care Protocol Journey Map */}
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 pl-2">Patient Journey Map</h3>

                <div className="relative pl-6 space-y-0">
                    {/* Vertical Line */}
                    <div className="absolute left-[31px] top-3 bottom-10 w-0.5 bg-gray-100 -z-0"></div>

                    {protocolSteps.map((step, index) => {
                        const isActive = index === activeStepIndex;
                        const isCompleted = index < activeStepIndex;
                        const isPending = index > activeStepIndex;

                        return (
                            <div key={step.uniqueId} className={`relative flex gap-6 pb-8 last:pb-0 group transition-all duration-500 ${isActive ? 'opacity-100' : isPending ? 'opacity-40 hover:opacity-60' : 'opacity-70'}`}>

                                {/* Status Indicator Dot */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all duration-300 bg-white ${isActive
                                    ? 'border-brand-cyan shadow-[0_0_0_4px_rgba(94,234,212,0.2)] scale-110 text-brand-cyan'
                                    : isCompleted
                                        ? 'border-green-500 bg-green-500 text-white'
                                        : 'border-gray-200 text-gray-300'
                                    }`}>
                                    {isCompleted ? <CheckIcon /> : <span className="text-xs font-bold">{index + 1}</span>}
                                </div>

                                <div className="flex-1 pt-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className={`text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</h4>
                                            {isActive && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                                        </div>
                                        {isActive && <span className="text-[9px] font-bold bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded uppercase tracking-wider">Current Stage</span>}
                                    </div>

                                    {/* Real Action Support - Always detailed for Active or Completed stages */}
                                    {(isActive || isCompleted) && (
                                        <div className="mt-4 space-y-2 hidden group-hover:block transition-all duration-300">
                                            {step.actions.map((item) => {
                                                const section = item.targetSection;
                                                const targetStatus = item.targetStatus;

                                                // Check if actually completed in real data
                                                let isDone = false;
                                                const hasRx = !!patient.clinic?.prescription;

                                                if (section === 'profile') {
                                                    isDone = patient.status !== 'Action Required';
                                                } else if (section === 'labs' || section === 'consultation' || section === 'shipment') {
                                                    // Only show shipment actions if Rx exists
                                                    if (section === 'shipment' && !hasRx) return null;

                                                    const currentStatus = patient.tracking?.[section]?.status;
                                                    if (targetStatus === 'completed' || targetStatus === 'Delivered') {
                                                        isDone = currentStatus === 'completed' || currentStatus === 'Delivered';
                                                    } else if (targetStatus === 'ongoing' || targetStatus === 'Shipped') {
                                                        isDone = currentStatus === 'ongoing' || currentStatus === 'completed' || currentStatus === 'Shipped' || currentStatus === 'Delivered';
                                                    }
                                                }

                                                // Check for linked tasks for active mapping
                                                const linkedTask = tasks.find(t =>
                                                    (section === 'labs' && t.types.includes('Lab Coordination')) ||
                                                    (section === 'consultation' && t.types.includes('New Consultation')) ||
                                                    (section === 'profile' && t.types.includes('Intake Review'))
                                                );

                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => !isDone && toggleAction(item, linkedTask)}
                                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${linkedTask && !isDone
                                                            ? 'bg-brand-purple/5 border-brand-purple/30 shadow-sm hover:bg-brand-purple/10'
                                                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                                                            } ${isDone ? 'opacity-70' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isDone
                                                                    ? 'bg-green-500 border-green-500 text-white'
                                                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                                                    }`}
                                                            >
                                                                {isDone && <CheckIcon />}
                                                            </div>
                                                            <span className={`text-xs font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                                                {item.label}
                                                            </span>
                                                        </div>

                                                        {!isDone && (
                                                            <span className="text-[9px] font-bold bg-brand-cyan/20 text-brand-cyan px-2 py-0.5 rounded uppercase tracking-wide">
                                                                {isActive ? 'Update' : 'Jump back'}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Cycle Button */}
                    <div className="relative flex gap-6 pb-2 group pt-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                            <span className="text-xs font-bold">+</span>
                        </div>
                        <div className="flex-1 pt-1">
                            <button
                                onClick={handleAddCycle}
                                className="w-full text-left p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-purple/50 hover:bg-brand-purple/5 transition-all group/btn"
                            >
                                <div className="flex items-center gap-2 text-gray-500 group-hover/btn:text-brand-purple">
                                    <PlusIcon />
                                    <span className="text-sm font-bold">Start Next Cycle</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 pl-6">Initiate Clinical/Pharmacy/Care loop for Cycle {currentCycle + 1}</p>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CareCoordinationCenter;