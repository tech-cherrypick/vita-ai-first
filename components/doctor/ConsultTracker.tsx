import React from 'react';
import { Patient } from '../../constants';

const ConsultIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

export const ConsultTracker: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Priority 1: Check dedicated consultation subcollection
    const consultData = patient.tracking?.consultation;
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
    let rawDate = hasConsultData && consultData.date
        ? consultData.date
        : (latestTimelineConsult ? latestTimelineConsult.date : null);

    // Robust Date Parsing
    let bookDate: Date | null = null;
    if (rawDate) {
        if (typeof rawDate === 'object' && 'toDate' in rawDate) {
            bookDate = (rawDate as any).toDate();
        } else {
            bookDate = new Date(rawDate);
        }
    }

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

export default ConsultTracker;
