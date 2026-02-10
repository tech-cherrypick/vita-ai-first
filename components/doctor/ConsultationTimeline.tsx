
import React from 'react';
import { Patient, TimelineEvent, TimelineVideoIcon, TimelineDocumentIcon, TimelineClipboardIcon, TimelineNoteIcon, TimelineShipmentIcon, TimelineProtocolIcon, PatientStatus } from '../../constants';
import CareProcessTracker from './CareProcessTracker';

interface ConsultationTimelineProps {
    patient: Patient; // Added full patient for data-driven bits
    timeline: TimelineEvent[];
    history?: TimelineEvent[];
    title?: string;
    status?: PatientStatus | string;
}

const eventTypeStyles = {
    Consultation: {
        icon: <TimelineVideoIcon />,
        bgColor: 'bg-brand-purple',
    },
    Labs: {
        icon: <TimelineDocumentIcon />,
        bgColor: 'bg-blue-500',
    },
    Assessment: {
        icon: <TimelineClipboardIcon />,
        bgColor: 'bg-green-500',
    },
    Note: {
        icon: <TimelineNoteIcon />,
        bgColor: 'bg-gray-500',
    },
    Shipment: {
        icon: <TimelineShipmentIcon />,
        bgColor: 'bg-orange-500',
    },
    Protocol: {
        icon: <TimelineProtocolIcon />,
        bgColor: 'bg-brand-cyan',
    }
};

// Sub-icons for composite events
const RxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const LabIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const ConsultIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;




const ConsultationTimeline: React.FC<ConsultationTimelineProps> = ({ patient, timeline, history = [], title = "Patient History", status }) => {
    // 1. Convert prescriptions to TimelineEvent format
    const prescriptionEvents: TimelineEvent[] = (patient.prescriptions || []).map(rx => ({
        id: rx.id || `rx-${rx.authorized_at}`,
        type: 'Protocol',
        title: 'Prescription Authorized',
        description: `Medication: ${rx.name} (${rx.dosage})\nStatus: ${rx.status}\nInstructions: ${rx.instructions || 'Follow as directed.'}`,
        date: rx.authorized_at
            ? (typeof rx.authorized_at === 'string' ? rx.authorized_at : new Date(rx.authorized_at._seconds * 1000).toLocaleDateString())
            : (rx.date || 'TBD'),
        doctor: rx.authorized_by,
        context: { rx }
    }));

    // 2. Merge all sources and de-duplicate
    const allEvents = [...timeline, ...history, ...prescriptionEvents];
    const uniqueEvents = Array.from(new Map(allEvents.map(e => [`${e.title}-${e.date}-${e.description?.slice(0, 20)}`, e])).values());

    // 3. Sort with the most recent event first
    const sortedTimeline = uniqueEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`🔍 [ConsultationTimeline] Events:`, sortedTimeline.length);
    console.log(`   History Prop:`, history.length);
    console.log(`   Latest Event:`, sortedTimeline[0]?.title, sortedTimeline[0]?.date);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>

            {/* Visual Process Tracker */}
            <CareProcessTracker patient={patient} />



            <div className="relative border-l-2 border-gray-200 pl-8">
                {sortedTimeline.map((event, index) => {
                    const styles = eventTypeStyles[event.type] || eventTypeStyles['Note'];
                    return (
                        <div key={event.id} className="mb-8 last:mb-0">
                            <span className={`absolute -left-4 flex items-center justify-center w-8 h-8 rounded-full ring-4 ring-white ${styles.bgColor}`}>
                                {styles.icon}
                            </span>
                            <div className="ml-4">
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                                    <time className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{event.date}</time>
                                </div>
                                {event.doctor && <p className="text-xs font-bold text-brand-purple mb-1">{event.doctor}</p>}
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </p>

                                {/* Rich Context Rendering for Composite Events */}
                                {(event.context?.rx || event.context?.labs || event.context?.consult || event.context?.shipment) && (
                                    <div className="mt-3 space-y-2">
                                        {event.context.rx && (
                                            <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex gap-3 items-start">
                                                <div className="text-green-600 mt-0.5"><RxIcon /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-green-800 uppercase mb-0.5">Rx Modification ({event.context.rx.type})</p>
                                                    <p className="text-sm font-bold text-gray-900">{event.context.rx.name} - {event.context.rx.dosage}</p>
                                                    <p className="text-xs text-gray-600 italic">{event.context.rx.instructions}</p>
                                                </div>
                                            </div>
                                        )}
                                        {event.context.labs && (
                                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-3 items-start">
                                                <div className="text-blue-600 mt-0.5"><LabIcon /></div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-xs font-bold text-blue-800 uppercase mb-0.5">Lab Record</p>
                                                        {event.context.labs.date && <span className="text-[10px] font-bold text-blue-400">{event.context.labs.date}</span>}
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900">{event.context.labs.orders || 'Standard Panel'}</p>
                                                    {event.context.labs.provider && (
                                                        <p className="text-xs text-gray-600 mt-1">Provider: <span className="font-semibold">{event.context.labs.provider}</span></p>
                                                    )}
                                                    {event.context.labs.status === 'completed' && (
                                                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full w-fit border border-teal-100">
                                                            <span>✨ Results Finalized</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {event.context.consult && (
                                            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex gap-3 items-start">
                                                <div className="text-purple-600 mt-0.5"><ConsultIcon /></div>
                                                <div>
                                                    <p className="text-xs font-bold text-purple-800 uppercase mb-0.5">Consultation Detail</p>
                                                    <p className="text-sm text-gray-900">{event.context.consult.type || 'Review Session'}</p>
                                                    {event.context.consult.date && <p className="text-xs text-gray-500">Held on {event.context.consult.date}</p>}
                                                </div>
                                            </div>
                                        )}
                                        {event.context.shipment && (
                                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex gap-3 items-start">
                                                <div className="text-orange-600 mt-0.5"><TimelineShipmentIcon /></div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-orange-800 uppercase mb-0.5">Shipment Tracking</p>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-bold text-gray-900">Status: {event.context.shipment.status}</p>
                                                        {event.context.shipment.courier && <span className="text-[10px] font-bold text-orange-400">{event.context.shipment.courier}</span>}
                                                    </div>
                                                    {event.context.shipment.trackingUrl && (
                                                        <a href={event.context.shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-purple font-bold mt-1 hover:underline">Track Package →</a>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Dynamic Action Links (Legacy Support) */}
                                <div className="flex flex-wrap gap-3 mt-3">
                                    {event.documentId && (
                                        <button
                                            onClick={() => alert(`Opening document: ${event.documentId}`)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            View Report
                                        </button>
                                    )}
                                    {event.context?.meetingLink && (
                                        <button
                                            onClick={() => alert(`Joining meeting: ${event.context.meetingLink}`)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-xs font-bold text-green-700 hover:bg-green-200 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            Join Call
                                        </button>
                                    )}
                                    {event.context?.trackingUrl && (
                                        <button
                                            onClick={() => alert(`Tracking package: ${event.context.trackingUrl}`)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-xs font-bold text-orange-700 hover:bg-orange-200 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                            Track Package
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default ConsultationTimeline;