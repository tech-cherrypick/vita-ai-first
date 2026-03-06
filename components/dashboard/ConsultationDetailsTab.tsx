import React, { useState } from 'react';
import { Patient } from '../../constants';

interface ConsultationDetailsTabProps {
    patient: Patient;
}

const ConsultationDetailsTab: React.FC<ConsultationDetailsTabProps> = ({ patient }) => {
    const [, setExpandedIdx] = useState<number | null>(null);

    // Use consultations sub-collection as the single source of truth.
    const allConsults = patient.consultations || [];
    // Sort newest first
    const consultations = [...allConsults].sort((a, b) => {
        const getTime = (c: any) => {
            if (c.timestamp?.seconds) return c.timestamp.seconds * 1000;
            if (typeof c.timestamp === 'string') return new Date(c.timestamp).getTime();
            if (c.date) return new Date(c.date).getTime();
            return 0;
        };
        return getTime(b) - getTime(a);
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
            {consultations.map((consultation, idx) => {
                // Support both new-style (summary at top level) and old-style (summary in context)
                const summary = consultation.summary || consultation.context?.summary;
                const transcript = consultation.transcript || consultation.context?.transcript;
                const title = consultation.title || 'Doctor Consultation';
                const date = consultation.date || 'Unknown Date';
                const doctor = consultation.doctor;

                return (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-purple mb-1">{date}</p>
                                <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                            </div>
                            {doctor && (
                                <span className="text-[10px] bg-brand-cyan/20 text-cyan-800 font-bold px-2 py-1 rounded-md">
                                    {doctor}
                                </span>
                            )}
                        </div>

                        {summary && (
                            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm mb-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">AI Summary</p>
                                <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{summary}</p>
                            </div>
                        )}

                        {transcript && (
                            <details className="group" onToggle={(e) => setExpandedIdx((e.target as HTMLDetailsElement).open ? idx : null)}>
                                <summary className="text-[10px] font-black text-brand-purple cursor-pointer hover:underline list-none flex items-center gap-1">
                                    <span>View Full Transcript</span>
                                    <svg className="w-3 h-3 transform transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-800">
                                    <p className="text-[10px] text-brand-bg/80 leading-relaxed font-mono whitespace-pre-wrap">{transcript}</p>
                                </div>
                            </details>
                        )}

                        {!summary && !transcript && (
                            <p className="text-xs text-gray-400 italic">No transcript or summary available for this session.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ConsultationDetailsTab;
