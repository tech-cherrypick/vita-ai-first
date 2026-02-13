import React from 'react';
import { Patient } from '../../constants';

const LabIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;

export const LabTracker: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Priority 1: Check dedicated labs subcollection
    const labsData = patient.tracking?.labs;
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

export default LabTracker;
