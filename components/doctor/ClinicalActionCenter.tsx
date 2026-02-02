import React, { useState } from 'react';
import { Patient, TimelineEvent, Prescription, PrescriptionLog, PatientStatus } from '../../constants';

interface ClinicalActionCenterProps {
    patient: Patient;
    onUpdatePatient: (patientId: number, newEvent: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => void;
}

type RxModificationType = 'replace' | 'add' | 'adjust' | 'onetime';

// Icons
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const RxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const LabIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const ConsultIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const ChevronUp = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;

// Helper to determine icon style based on event type
const getEventStyles = (type: string, title?: string) => {
    // Override for composite events based on title or content could go here
    if (title === 'Clinical Plan Update') return { bg: 'bg-brand-purple', text: 'text-white', icon: <NoteIcon /> };

    switch (type) {
        case 'Labs': return { bg: 'bg-blue-100', text: 'text-blue-600', icon: <LabIcon /> };
        case 'Consultation': return { bg: 'bg-purple-100', text: 'text-purple-600', icon: <ConsultIcon /> };
        case 'Protocol': return { bg: 'bg-green-100', text: 'text-green-600', icon: <RxIcon /> };
        case 'Shipment': return { bg: 'bg-orange-100', text: 'text-orange-600', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> };
        default: return { bg: 'bg-gray-100', text: 'text-gray-500', icon: <NoteIcon /> };
    }
};

interface TimelineItemProps {
    event: TimelineEvent;
    isExpanded: boolean;
    onToggle: () => void;
    isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ event, isExpanded, onToggle, isLast }) => {
    const style = getEventStyles(event.type, event.title);

    return (
        <div className="flex gap-4 relative">
            <div className="flex flex-col items-center">
                <button
                    onClick={onToggle}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm transition-transform hover:scale-105 ${style.bg} ${style.text}`}
                >
                    {style.icon}
                </button>
                {!isLast && <div className="w-0.5 h-full bg-gray-200 absolute top-10 -z-0"></div>}
            </div>
            <div className="pb-8 flex-1 pt-1 min-w-0">
                <div
                    className="flex justify-between items-start cursor-pointer group"
                    onClick={onToggle}
                >
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-purple transition-colors">{event.title}</h4>
                        <p className="text-xs text-gray-500">{event.date} • {event.doctor || 'System'}</p>
                    </div>
                    <button className="text-gray-400 group-hover:text-brand-purple">
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </button>
                </div>

                {/* Collapsed Preview */}
                {!isExpanded && (
                    <p className="text-sm text-gray-600 mt-1 truncate cursor-pointer" onClick={onToggle}>{event.description}</p>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in text-sm text-gray-700 space-y-3">
                        <p className="font-medium whitespace-pre-wrap">{event.description}</p>

                        {/* Composite Event Renderers */}
                        {event.context?.rx && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200 border-l-4 border-l-green-500">
                                <div className="flex items-center gap-2 mb-1">
                                    <RxIcon />
                                    <span className="font-bold text-xs text-gray-500 uppercase">Rx Modification ({event.context.rx.type})</span>
                                </div>
                                <div className="text-gray-900 font-semibold">{event.context.rx.name} - {event.context.rx.dosage}</div>
                                <div className="text-xs text-gray-500 italic">{event.context.rx.instructions}</div>
                            </div>
                        )}

                        {event.context?.labs && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200 border-l-4 border-l-blue-500">
                                <div className="flex items-center gap-2 mb-1">
                                    <LabIcon />
                                    <span className="font-bold text-xs text-gray-500 uppercase">Labs Ordered</span>
                                </div>
                                <div className="text-gray-900">{event.context.labs.orders}</div>
                            </div>
                        )}

                        {event.context?.consult && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200 border-l-4 border-l-purple-500">
                                <div className="flex items-center gap-2 mb-1">
                                    <ConsultIcon />
                                    <span className="font-bold text-xs text-gray-500 uppercase">Follow-up Request</span>
                                </div>
                                <div className="text-gray-900">Timeframe: {event.context.consult.timeframe}</div>
                            </div>
                        )}

                        {/* Raw Context Dump if not handled above (legacy) */}
                        {event.context && !event.context.rx && !event.context.labs && !event.context.consult && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Details</p>
                                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                    {JSON.stringify(event.context, null, 2)}
                                </pre>
                            </div>
                        )}
                        {event.documentId && (
                            <button className="text-xs font-bold text-brand-purple hover:underline flex items-center gap-1 mt-2">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                View Document ({event.documentId})
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Tracking Components ---

const LabTracker: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Priority 1: Check dedicated labs subcollection
    const labsData = patient.labs;
    const hasLabsData = labsData && Object.keys(labsData).length > 0;

    // Priority 2: Check timeline for lab events
    const labEvents = patient.timeline.filter(e =>
        e.type === 'Labs' ||
        e.context?.labs ||
        (e.title && /Lab|Test|Panel|Diagnostics/i.test(e.title)) ||
        (e.description && /ordered|booked|scheduled/i.test(e.description) && /lab|test|panel/i.test(e.description))
    );
    labEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestTimelineOrder = labEvents.length > 0 ? labEvents[0] : null;

    // Use labs subcollection data if available, otherwise fall back to timeline
    const orderDate = hasLabsData && labsData.date
        ? new Date(labsData.date)
        : (latestTimelineOrder ? new Date(latestTimelineOrder.date) : null);

    const orderedBy = hasLabsData ? labsData.doctorName : latestTimelineOrder?.doctor;

    if (!orderDate) return null;

    // 2. Check for Collection
    const collectionEvent = patient.timeline.find(e =>
        new Date(e.date) >= orderDate &&
        (
            (e.type === 'Status' && e.title.includes('Collected')) ||
            (e.type === 'Upload') ||
            (e.context?.vitals) ||
            (/collected|sample|blood|drawn/i.test(e.title || '') || /collected|sample|blood|drawn/i.test(e.description || ''))
        )
    );
    const vitalCollection = patient.vitals.find(v => new Date(v.date) >= orderDate);
    const isCollected = !!collectionEvent || !!vitalCollection;
    const collectionDate = collectionEvent?.date || vitalCollection?.date;

    // 3. Check for Report
    const report = patient.reports.find(r => new Date(r.date) >= orderDate);
    const reportEvent = patient.timeline.find(e =>
        new Date(e.date) >= orderDate &&
        (/report|result|analysis/i.test(e.title || '') || /report|result/i.test(e.description || ''))
    );
    const isReportReady = !!report || !!reportEvent;
    const reportDate = report?.date || reportEvent?.date;

    const steps = [
        { label: 'Ordered', date: orderDate.toLocaleDateString(), status: 'completed' },
        { label: 'Collected', date: collectionDate || '-', status: isCollected ? 'completed' : 'pending' },
        { label: 'Report Ready', date: reportDate || '-', status: isReportReady ? 'completed' : 'pending' }
    ];

    return (
        <div className="bg-white border-b border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
                <LabIcon />
                <h4 className="text-xs font-bold text-gray-500 uppercase">Lab Status</h4>
                {orderedBy && <span className="text-[10px] text-gray-400 ml-auto">by {orderedBy}</span>}
            </div>
            <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-0"></div>
                {steps.map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center bg-white px-2">
                        <div className={`w-3 h-3 rounded-full mb-2 ${step.status === 'completed' ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-gray-200'}`}></div>
                        <span className={`text-[10px] font-bold ${step.status === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                        <span className="text-[10px] text-gray-400">{step.status === 'completed' ? step.date : ''}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ConsultTracker: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Priority 1: Check dedicated consultation subcollection
    const consultData = patient.consultation;
    const hasConsultData = consultData && Object.keys(consultData).length > 0;

    // Priority 2: Check timeline for consultation events
    const consultEvents = patient.timeline.filter(e =>
        e.type === 'Consultation' ||
        e.context?.consult ||
        (/consult|appointment|video|call/i.test(e.title || '')) ||
        (e.description && /scheduled|booked|request/i.test(e.description) && /consult|appointment|dr|video/i.test(e.description))
    );
    consultEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestTimelineConsult = consultEvents.length > 0 ? consultEvents[0] : null;

    // Use consultation subcollection data if available, otherwise fall back to timeline
    const bookDate = hasConsultData && consultData.date
        ? new Date(consultData.date)
        : (latestTimelineConsult ? new Date(latestTimelineConsult.date) : null);

    const bookedBy = hasConsultData ? consultData.doctorName : latestTimelineConsult?.doctor;
    const consultTime = hasConsultData ? consultData.time : null;

    if (!bookDate) return null;

    // 2. Check for Completion
    const completionEvent = patient.timeline.find(e =>
        new Date(e.date) >= bookDate &&
        e.id !== latestTimelineConsult?.id &&
        (
            (e.type === 'Note' || e.type === 'Protocol') && e.doctor
            || (/completed|done|finished|summary/i.test(e.title || '') && /consult|visit|call/i.test(e.title || ''))
            || (/completed|conducted/i.test(e.description || ''))
        )
    );
    const isCompleted = !!completionEvent;

    const steps = [
        { label: 'Booked', date: bookDate.toLocaleDateString() + (consultTime ? ` ${consultTime}` : ''), status: 'completed' },
        { label: 'Completed', date: completionEvent?.date || '-', status: isCompleted ? 'completed' : 'pending' }
    ];

    return (
        <div className="bg-white border-b border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
                <ConsultIcon />
                <h4 className="text-xs font-bold text-gray-500 uppercase">Consultation Status</h4>
                {bookedBy && <span className="text-[10px] text-gray-400 ml-auto">by {bookedBy}</span>}
            </div>
            <div className="flex items-center justify-between relative max-w-[60%]">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-0"></div>
                {steps.map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center bg-white px-2">
                        <div className={`w-3 h-3 rounded-full mb-2 ${step.status === 'completed' ? 'bg-purple-500 ring-4 ring-purple-100' : 'bg-gray-200'}`}></div>
                        <span className={`text-[10px] font-bold ${step.status === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                        <span className="text-[10px] text-gray-400">{step.status === 'completed' ? step.date : ''}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ClinicalActionCenter: React.FC<ClinicalActionCenterProps> = ({ patient, onUpdatePatient }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

    // --- Pathway State ---
    const [isEditingPathway, setIsEditingPathway] = useState(false);
    const [currentPathway, setCurrentPathway] = useState(patient.pathway?.split(' - ')[0] || 'Standard GLP-1 Protocol');
    const [pathwayDetails, setPathwayDetails] = useState(
        patient.pathway && patient.pathway.includes(' - ') ? patient.pathway.split(' - ')[1] : ''
    );

    // --- Composite Form State ---
    const [noteContent, setNoteContent] = useState('');

    const [includeRx, setIncludeRx] = useState(false);
    const [rxActionType, setRxActionType] = useState<RxModificationType>('replace');
    const [rxName, setRxName] = useState(patient.currentPrescription.name);
    const [rxDose, setRxDose] = useState(patient.currentPrescription.dosage);
    const [rxInstructions, setRxInstructions] = useState(patient.currentPrescription.instructions);

    const [includeLabs, setIncludeLabs] = useState(false);
    const [labsInput, setLabsInput] = useState('');

    const [includeConsult, setIncludeConsult] = useState(false);
    const [consultTime, setConsultTime] = useState('1 week');

    const handleToggleEvent = (id: string) => {
        setExpandedEventId(prev => prev === id ? null : id);
    };

    const handlePathwaySave = () => {
        const finalPathwayString = pathwayDetails.trim()
            ? `${currentPathway} - ${pathwayDetails}`
            : currentPathway;

        onUpdatePatient(patient.id, {
            type: 'Protocol',
            title: 'Clinical Pathway Updated',
            description: `Protocol updated to: ${finalPathwayString}`,
            doctor: patient.careTeam.physician
        }, { pathway: finalPathwayString });

        setIsEditingPathway(false);
        setSuccessMessage('Pathway updated.');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleDownloadRx = () => {
        const protocolContent = `
VITA HEALTH - TREATMENT PROTOCOL
--------------------------------
Patient: ${patient.name}
Date: ${new Date().toLocaleDateString()}
Physician: ${patient.careTeam.physician}

PROTOCOL: ${patient.pathway || 'Standard GLP-1 Protocol'}

Medication: ${patient.currentPrescription.name}
Dosage: ${patient.currentPrescription.dosage}
Instructions: ${patient.currentPrescription.instructions}

Notes:
- Monitor for side effects.
- Follow up in 4 weeks.
        `.trim();

        const blob = new Blob([protocolContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rx_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const submitCompositeAction = () => {
        // Validation: Must have note OR at least one action selected
        const hasAction = includeRx || includeLabs || includeConsult;

        if (!noteContent.trim() && !hasAction) {
            alert("Please enter a clinical note or select an action to submit.");
            return;
        }

        setIsLoading(true);
        let updates: Partial<Patient> = {};

        // Build Composite Context
        const context: any = {};
        let statusUpdate: PatientStatus = 'Ongoing Treatment';

        // 1. Rx Logic
        if (includeRx) {
            context.rx = {
                type: rxActionType,
                name: rxName,
                dosage: rxDose,
                instructions: rxInstructions
            };

            statusUpdate = 'Awaiting Shipment';

            // Apply updates to patient object
            if (rxActionType === 'replace' || rxActionType === 'adjust' || rxActionType === 'add') {
                updates.currentPrescription = {
                    name: rxName,
                    dosage: rxDose,
                    instructions: rxInstructions
                };
            }
        }

        // 2. Labs Logic
        if (includeLabs) {
            context.labs = { orders: labsInput };
            statusUpdate = 'Additional Testing Required'; // Overrides Rx status usually
        }

        // 3. Consult Logic
        if (includeConsult) {
            context.consult = { timeframe: consultTime };
            if (!includeLabs) statusUpdate = 'Follow-up Required';
        }

        updates.status = statusUpdate;

        // Auto-generate description if note is empty but actions exist
        let finalDescription = noteContent;
        if (!finalDescription.trim()) {
            const actions = [];
            if (includeRx) actions.push(`Rx Modified (${rxActionType})`);
            if (includeLabs) actions.push("Labs Ordered");
            if (includeConsult) actions.push(`Follow-up Requested (${consultTime})`);
            finalDescription = `Plan Actions: ${actions.join(', ')}`;
        }

        // Construct Composite Event
        const event: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Note', // Base type, styled specially via title
            title: 'Clinical Plan Update',
            description: finalDescription,
            doctor: patient.careTeam.physician,
            context: context
        };

        setTimeout(() => {
            onUpdatePatient(patient.id, event, updates);
            setIsLoading(false);
            setSuccessMessage('Clinical plan updated successfully.');

            // Reset Form
            setNoteContent('');
            setIncludeRx(false);
            setIncludeLabs(false);
            setIncludeConsult(false);
            setLabsInput('');
            // Keep Rx fields populated with latest for convenience or reset? Resetting is safer.
            // But if they just updated it, maybe they want to see it. 
            // Let's reset to current valid state (which is the new state)
            // Ideally we'd re-read props, but for now just leave them as they are or reset to empty

            setTimeout(() => setSuccessMessage(null), 3000);
        }, 1000);
    };

    // Sort timeline: recent first
    const timeline = [...patient.timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[850px]">

            {/* 1. Header: Clinical Pathway */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white shrink-0 z-20">
                <div className="flex justify-between items-start">
                    <div className="w-full">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Treatment Protocol</h2>
                        {isEditingPathway ? (
                            <div className="mt-2 space-y-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm animate-fade-in">
                                <select
                                    value={currentPathway}
                                    onChange={(e) => setCurrentPathway(e.target.value)}
                                    className="w-full text-sm p-2 rounded bg-white text-gray-900 border border-gray-200 outline-none"
                                >
                                    <option>Standard GLP-1 Protocol</option>
                                    <option>Intensive Medical Weight Loss</option>
                                    <option>Maintenance Protocol</option>
                                    <option>Custom Protocol</option>
                                </select>
                                <input
                                    value={pathwayDetails}
                                    onChange={(e) => setPathwayDetails(e.target.value)}
                                    placeholder="Details (e.g. 0.25mg start)"
                                    className="w-full text-sm p-2 rounded bg-white text-gray-900 border border-gray-200 outline-none"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setIsEditingPathway(false)} className="text-xs font-bold text-gray-400 px-2">Cancel</button>
                                    <button onClick={handlePathwaySave} className="text-xs font-bold bg-brand-purple px-3 py-1 rounded">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <div>
                                    <h1 className="text-lg font-bold">{patient.pathway || 'Standard GLP-1 Protocol'}</h1>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleDownloadRx} className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Rx
                                    </button>
                                    <button onClick={() => setIsEditingPathway(true)} className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 1.5 Tracking Widgets (New Section) */}
            <div className="flex border-b border-gray-200">
                <div className="w-1/2 border-r border-gray-100">
                    <LabTracker patient={patient} />
                </div>
                <div className="w-1/2">
                    <ConsultTracker patient={patient} />
                </div>
            </div>

            {/* 2. Unified Clinical Action Form */}
            <div className="bg-gray-50 border-b border-gray-200 shrink-0 z-10 shadow-sm relative p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-purple"></span> Clinical Update
                </h3>

                {/* Note Area */}
                <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter clinical assessment, plan details, or observation..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-purple outline-none text-sm transition-all mb-4"
                    rows={3}
                />

                {/* Toggles */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setIncludeRx(!includeRx)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${includeRx ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:border-green-300'}`}
                    >
                        {includeRx ? '✓' : '+'} Prescription
                    </button>
                    <button
                        onClick={() => setIncludeLabs(!includeLabs)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${includeLabs ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'}`}
                    >
                        {includeLabs ? '✓' : '+'} Labs
                    </button>
                    <button
                        onClick={() => setIncludeConsult(!includeConsult)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${includeConsult ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300'}`}
                    >
                        {includeConsult ? '✓' : '+'} Consult
                    </button>
                </div>

                {/* Conditional Inputs */}
                <div className="space-y-3">

                    {/* Rx Form */}
                    {includeRx && (
                        <div className="p-4 bg-white rounded-xl border border-green-100 shadow-sm animate-fade-in">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-green-700 uppercase">Rx Modification</h4>
                                <select
                                    value={rxActionType}
                                    onChange={(e) => setRxActionType(e.target.value as RxModificationType)}
                                    className="text-xs p-1 bg-green-50 border border-green-200 rounded text-green-800 outline-none"
                                >
                                    <option value="replace">Replace Current</option>
                                    <option value="add">Add Medication</option>
                                    <option value="adjust">Adjust Dosage</option>
                                    <option value="onetime">One-time Order</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    value={rxName}
                                    onChange={(e) => setRxName(e.target.value)}
                                    placeholder="Medication Name"
                                    className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-400"
                                />
                                <input
                                    type="text"
                                    value={rxDose}
                                    onChange={(e) => setRxDose(e.target.value)}
                                    placeholder="Dosage"
                                    className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-400"
                                />
                            </div>
                            <input
                                type="text"
                                value={rxInstructions}
                                onChange={(e) => setRxInstructions(e.target.value)}
                                placeholder="Instructions"
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-400"
                            />
                        </div>
                    )}

                    {/* Labs Form */}
                    {includeLabs && (
                        <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                            <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Order Diagnostics</h4>
                            <input
                                type="text"
                                value={labsInput}
                                onChange={(e) => setLabsInput(e.target.value)}
                                placeholder="List required labs (e.g. Lipid Panel, HbA1c)..."
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
                            />
                        </div>
                    )}

                    {/* Consult Form */}
                    {includeConsult && (
                        <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm animate-fade-in flex items-center gap-3">
                            <h4 className="text-xs font-bold text-purple-700 uppercase">Request Follow-up:</h4>
                            <select
                                value={consultTime}
                                onChange={(e) => setConsultTime(e.target.value)}
                                className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-400"
                            >
                                <option>ASAP</option>
                                <option>1 week</option>
                                <option>2 weeks</option>
                                <option>1 month</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <button
                        onClick={submitCompositeAction}
                        disabled={isLoading}
                        className="w-full bg-brand-purple text-white py-3 rounded-xl font-bold shadow-lg shadow-brand-purple/20 hover:bg-brand-purple/90 transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : 'Submit Clinical Plan'}
                    </button>
                    {successMessage && (
                        <p className="text-xs text-green-600 font-bold mt-2 text-center animate-fade-in">{successMessage}</p>
                    )}
                </div>
            </div>

            {/* 3. Scrollable Timeline */}
            <div className="flex-1 overflow-y-auto p-6 bg-white relative">
                {timeline.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">No history available.</div>
                ) : (
                    timeline.map((event, idx) => (
                        <TimelineItem
                            key={event.id}
                            event={event}
                            isExpanded={expandedEventId === event.id}
                            onToggle={() => handleToggleEvent(event.id)}
                            isLast={idx === timeline.length - 1}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ClinicalActionCenter;