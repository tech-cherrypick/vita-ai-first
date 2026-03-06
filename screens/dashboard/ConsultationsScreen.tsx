import React from 'react';
import { Patient, TimelineEvent } from '../../constants';

interface ConsultationsScreenProps {
    patient: Patient;
    isDoctorInCall: boolean;
    onJoinCall: () => void;
}

const ConsultationRecord: React.FC<{ consultation: any, idx: number }> = ({ consultation, idx }) => {
    const [showTranscript, setShowTranscript] = React.useState(false);

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-purple mb-1">{consultation.date || new Date(consultation.timestamp?.seconds * 1000).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <h4 className="text-lg font-black text-gray-900 mb-2">{consultation.title}</h4>
                    <p className="text-sm text-gray-500 font-semibold italic">Physician: {consultation.doctor || 'Assigned Physician'}</p>
                </div>
                <div className="flex-1 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">AI Summary</p>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                            {consultation.summary || consultation.context?.summary || (consultation.description !== 'The video call transcript and summary have been generated.' ? consultation.description : 'Summary is being processed...')}
                        </p>
                    </div>
                    {(consultation.transcript || consultation.context?.transcript) && (
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowTranscript(!showTranscript)}
                                className="text-xs font-black text-brand-purple flex items-center gap-1 hover:underline"
                            >
                                <span>{showTranscript ? 'Hide Full Transcript' : 'View Full Transcript'}</span>
                                <svg className={`w-3 h-3 transform transition-transform ${showTranscript ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showTranscript && (
                                <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 animate-fade-in">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-cyan mb-2">Full Transcription</p>
                                    <p className="text-xs text-brand-bg/80 leading-relaxed font-mono whitespace-pre-wrap">
                                        {consultation.transcript || consultation.context?.transcript}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ConsultationsScreen: React.FC<ConsultationsScreenProps> = ({ patient, isDoctorInCall, onJoinCall }) => {
    // Both timeline and patient_history might contain Consultation events.
    const allEvents = [...(patient.timeline || []), ...(patient.patient_history || [])];
    const consultations = allEvents.filter(e => e.type === 'Consultation');

    // Check for an upcoming consult (scheduled but not reviewed/completed)
    const upcomingConsult = consultations.find(e => e.title.includes('Scheduled'));
    // Use consultations sub-collection as THE single source of truth.
    // We no longer fallback to patient_history/timeline for 'Consultation' types
    // to ensure that deletions in the DB are reflected immediately in the UI.
    const allConsults = patient.consultations || [];

    // Past records are those not marked as 'Scheduled'
    const finalConsultations = allConsults
        .filter(c => !String(c.title || '').includes('Scheduled'))
        .sort((a, b) => {
            const dateA = a.timestamp ? (a.timestamp.seconds || new Date(a.date).getTime()) : 0;
            const dateB = b.timestamp ? (b.timestamp.seconds || new Date(b.date).getTime()) : 0;
            return dateB - dateA;
        });

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">My Consultations</h1>
                <p className="text-gray-500 font-medium leading-relaxed max-w-2xl">
                    View your scheduled video calls and access transcripts and summaries from past sessions.
                </p>
            </header>

            {/* Active/Upcoming Consultation Card */}
            {upcomingConsult && (
                <div className="bg-white rounded-[32px] p-8 border border-brand-purple/20 shadow-xl shadow-brand-purple/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-3xl shadow-inner">
                                📅
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-brand-purple/10 text-brand-purple text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Upcoming</span>
                                    {isDoctorInCall && (
                                        <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md animate-pulse">Doctor Active</span>
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-gray-900">{upcomingConsult.title}</h3>
                                <p className="text-gray-500 font-semibold">{upcomingConsult.date}</p>
                            </div>
                        </div>

                        <button
                            disabled={!isDoctorInCall}
                            onClick={onJoinCall}
                            className={`px-10 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-lg ${isDoctorInCall
                                ? 'bg-brand-purple text-white hover:bg-brand-purple/90 hover:scale-105 active:scale-95 shadow-brand-purple/30'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {isDoctorInCall ? 'Join Now' : 'Join Call'}
                        </button>
                    </div>
                    {!isDoctorInCall && (
                        <p className="mt-4 text-[11px] text-gray-400 font-bold flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Waiting for the doctor to join. The join button will activate automatically.
                        </p>
                    )}
                </div>
            )}

            {/* Past Consultations */}
            <div>
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm">📜</span>
                    Past Records
                </h2>

                {finalConsultations.length === 0 ? (
                    <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold">No past consultation records found.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {finalConsultations.map((c, idx) => (
                            <ConsultationRecord key={c.id || idx} consultation={c} idx={idx} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultationsScreen;
