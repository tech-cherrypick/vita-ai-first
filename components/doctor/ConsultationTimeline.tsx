
import React from 'react';
import { TimelineEvent, TimelineVideoIcon, TimelineDocumentIcon, TimelineClipboardIcon, TimelineNoteIcon, TimelineShipmentIcon, TimelineProtocolIcon } from '../../constants';

interface ConsultationTimelineProps {
    timeline: TimelineEvent[];
    title?: string;
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


const ConsultationTimeline: React.FC<ConsultationTimelineProps> = ({ timeline, title = "Patient History" }) => {
    // Sort timeline with the most recent event first
    const sortedTimeline = [...timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
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
                                {(event.context?.rx || event.context?.labs || event.context?.consult) && (
                                    <div className="mt-3 space-y-2">
                                        {event.context.rx && (
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex gap-3 items-start">
                                                <div className="text-green-600 mt-0.5"><RxIcon/></div>
                                                <div>
                                                    <p className="text-xs font-bold text-green-800 uppercase mb-0.5">Rx Modification ({event.context.rx.type})</p>
                                                    <p className="text-sm font-bold text-gray-900">{event.context.rx.name} - {event.context.rx.dosage}</p>
                                                    <p className="text-xs text-gray-600 italic">{event.context.rx.instructions}</p>
                                                </div>
                                            </div>
                                        )}
                                        {event.context.labs && (
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3 items-start">
                                                <div className="text-blue-600 mt-0.5"><LabIcon/></div>
                                                <div>
                                                    <p className="text-xs font-bold text-blue-800 uppercase mb-0.5">Labs Ordered</p>
                                                    <p className="text-sm text-gray-900">{event.context.labs.orders}</p>
                                                </div>
                                            </div>
                                        )}
                                        {event.context.consult && (
                                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex gap-3 items-start">
                                                <div className="text-purple-600 mt-0.5"><ConsultIcon/></div>
                                                <div>
                                                    <p className="text-xs font-bold text-purple-800 uppercase mb-0.5">Follow-up Request</p>
                                                    <p className="text-sm text-gray-900">Timeframe: {event.context.consult.timeframe}</p>
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
