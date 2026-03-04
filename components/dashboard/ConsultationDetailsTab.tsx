import React from 'react';
import { Patient, TimelineEvent } from '../../constants';

interface ConsultationDetailsTabProps {
    patient: Patient;
}

const ConsultationDetailsTab: React.FC<ConsultationDetailsTabProps> = ({ patient }) => {
    // Use consultations sub-collection as the single source of truth.
    const allConsults = patient.consultations || [];
    const consultations = allConsults
        .filter(e => !String(e.title || '').includes('Scheduled'))
        .sort((a, b) => {
            const dateA = a.timestamp ? (a.timestamp.seconds || new Date(a.date).getTime()) : 0;
            const dateB = b.timestamp ? (b.timestamp.seconds || new Date(b.date).getTime()) : 0;
            return dateB - dateA;
        });

    if (consultations.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-gray-400 font-medium">No past consultation transcripts available yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {consultations.map((consultation, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-purple mb-1">{consultation.date}</p>
                            <h4 className="text-sm font-bold text-gray-900">{consultation.title}</h4>
                        </div>
                        {consultation.doctor && (
                            <span className="text-[10px] bg-brand-cyan/20 text-cyan-800 font-bold px-2 py-1 rounded-md">
                                {consultation.doctor}
                            </span>
                        )}
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">AI Summary</p>
                        <p className="text-xs text-gray-700 leading-relaxed font-medium">
                            {consultation.summary || consultation.context?.summary || (consultation.description !== 'The video call transcript and summary have been generated.' ? consultation.description : 'Summary is being processed...')}
                        </p>
                    </div>

                    {(consultation.transcript || consultation.context?.transcript) && (
                        <details className="mt-3 group">
                            <summary className="text-[10px] font-black text-brand-purple cursor-pointer hover:underline list-none flex items-center gap-1">
                                <span>View Transcript</span>
                                <svg className="w-3 h-3 transform transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </summary>
                            <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-800">
                                <p className="text-[10px] text-brand-bg/80 leading-relaxed font-mono whitespace-pre-wrap">
                                    {consultation.transcript || consultation.context?.transcript}
                                </p>
                            </div>
                        </details>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ConsultationDetailsTab;
