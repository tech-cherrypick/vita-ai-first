
import React, { useState, useMemo, useEffect } from 'react';
import UserHeader from '../components/dashboard/UserHeader';
import LabScheduler from '../components/dashboard/LabScheduler';
import FirstDoseCall from '../components/dashboard/FirstDoseCall';
import PrescriptionView from '../components/dashboard/PrescriptionView';
import TreatmentTimeline from '../components/dashboard/TreatmentTimeline';
import { Patient, TimelineEvent } from '../constants';
import SideMenu from '../components/dashboard/SideMenu';
import MyProfileScreen from './dashboard/MyProfileScreen';
import ReportsScreen from './dashboard/ReportsScreen';
import PaymentsScreen from './dashboard/PaymentsScreen';
import CareTeamScreen from './dashboard/CareTeamScreen';
import HelpScreen from './dashboard/HelpScreen';
import PatientOverviewHero from '../components/dashboard/PatientOverviewHero';
import ConsultationScheduler from '../components/dashboard/ConsultationScheduler';
import PatientActionCenter from '../components/dashboard/PatientActionCenter';
import MedicalProfiler from '../components/MedicalProfiler';
import PsychoProfiler from '../components/PsychoProfiler';
import DigitalIntake from '../components/dashboard/DigitalIntake';
import PatientLive from './PatientLive';
import PatientMessagesScreen from './dashboard/PatientMessagesScreen';

export type DashboardView = 'dashboard' | 'profile' | 'reports' | 'payments' | 'care_team' | 'help' | 'live' | 'messages';
type FocusMode = 'none' | 'intake_medical_ai' | 'intake_medical_form' | 'intake_psych_ai' | 'intake_psych_form' | 'schedule_labs' | 'schedule_consult' | 'telehealth' | 'view_plan';

interface UserDashboardProps {
    onSignOut: () => void;
    patient: Patient;
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates?: Partial<Patient>) => void;
    userName: string;
}

const ModalWrapper: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode, maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`bg-white w-full ${maxWidth} rounded-2xl shadow-2xl overflow-hidden relative flex flex-col animate-slide-in-up max-h-[90vh]`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Treatment Progress Section (Below Grid) ---
const TreatmentProgressSection: React.FC<{ patient: Patient; onUpdatePatient: any }> = ({ patient, onUpdatePatient }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8 transition-all duration-300">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-6 flex justify-between items-center bg-gradient-to-r from-brand-purple/5 to-transparent hover:bg-brand-purple/10 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-purple/20 text-brand-purple flex items-center justify-center text-2xl">
                        📈
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">Treatment Progress</h3>
                        <p className="text-sm text-gray-500">Track your daily habits and weekly milestones.</p>
                    </div>
                </div>
                <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} text-gray-400`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 border-t border-gray-100">
                    <TreatmentTimeline patient={patient} onUpdatePatient={onUpdatePatient} />
                </div>
            </div>
        </div>
    );
}


// --- Care Modules Grid Component ---
const CareModulesGrid: React.FC<{ patient: Patient; onNavigate: (mode: FocusMode) => void }> = ({ patient, onNavigate }) => {

    // 1. Intelligent Appointment Detection
    const labScheduleIndex = patient.timeline.findIndex(e => e.type === 'Labs' && e.title.includes('Scheduled'));
    const labResultsIndex = patient.timeline.findIndex(e => e.type === 'Labs' && (e.title.includes('Results') || e.title.includes('Reviewed')));
    const activeLabAppointment = (labScheduleIndex !== -1 && (labResultsIndex === -1 || labScheduleIndex < labResultsIndex))
        ? patient.timeline[labScheduleIndex]
        : null;

    const consultScheduleIndex = patient.timeline.findIndex(e => e.type === 'Consultation' && e.title.includes('Scheduled'));
    const consultCompleteIndex = patient.timeline.findIndex(e => e.type === 'Consultation' && (e.title.includes('Completed') || e.title.includes('Review')));
    const activeConsultAppointment = (consultScheduleIndex !== -1 && (consultCompleteIndex === -1 || consultScheduleIndex < consultCompleteIndex))
        ? patient.timeline[consultScheduleIndex]
        : null;

    // 2. Intake Status
    const intakeComplete = patient.status !== 'Action Required' || patient.weeklyLogs.length > 0;

    const modules = [
        // Module 1: Medical History (Split)
        {
            title: 'Medical History',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            statusLabel: intakeComplete ? 'Complete' : 'Incomplete',
            statusColor: intakeComplete ? 'text-teal-700 bg-teal-50 border-teal-200' : 'text-red-700 bg-red-50 border-red-200',
            iconBg: 'bg-teal-100 text-teal-600',
            detail: 'Diseases, medications, family history, and safety screen.',
            dualAction: true,
            actions: [
                { label: 'Start AI Interview', target: 'intake_medical_ai' as FocusMode, icon: '🎙️' },
                { label: 'Fill Form', target: 'intake_medical_form' as FocusMode, icon: '📝' }
            ]
        },

        // Module 2: Psychographic Profile (Split)
        {
            title: 'Psychographic Profile',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            statusLabel: 'Pending',
            statusColor: 'text-gray-700 bg-gray-50 border-gray-200',
            iconBg: 'bg-pink-100 text-pink-600',
            detail: 'Mood (PHQ-9), Binge Eating (BES), and Attitudes (EAT-26).',
            dualAction: true,
            actions: [
                { label: 'Start AI Interview', target: 'intake_psych_ai' as FocusMode, icon: '🎙️' },
                { label: 'Fill Form', target: 'intake_psych_form' as FocusMode, icon: '📝' }
            ]
        },

        // Module 3: Labs
        {
            title: 'Root-Cause Labs',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
            statusLabel: activeLabAppointment ? 'Scheduled' : (patient.status.includes('Lab') ? 'Action Required' : 'Up to Date'),
            statusColor: activeLabAppointment ? 'text-blue-700 bg-blue-50 border-blue-200' : (patient.status.includes('Lab') ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'),
            iconBg: 'bg-blue-100 text-blue-600',
            detail: activeLabAppointment
                ? `Booked: ${activeLabAppointment.context?.labDateTime || activeLabAppointment.date}`
                : 'Metabolic panel results and requisition orders.',
            actionLabel: activeLabAppointment ? 'Manage Appointment' : 'Book Visit',
            target: 'schedule_labs' as FocusMode
        },

        // Module 4: Consults
        {
            title: 'Doctor Consults',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
            statusLabel: activeConsultAppointment ? 'Scheduled' : (['Ready for Consult', 'Follow-up Required'].includes(patient.status) ? 'Action Required' : 'Standard'),
            statusColor: activeConsultAppointment ? 'text-green-700 bg-green-50 border-green-200' : (['Ready for Consult', 'Follow-up Required'].includes(patient.status) ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-700 bg-gray-50 border-gray-200'),
            iconBg: 'bg-green-100 text-green-600',
            detail: activeConsultAppointment
                ? `Booked: ${activeConsultAppointment.context?.consultDateTime || activeConsultAppointment.date}`
                : 'Video visits with your care team.',
            actionLabel: activeConsultAppointment ? 'Manage Appointment' : 'Schedule Now',
            target: 'schedule_consult' as FocusMode
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {modules.map((mod, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${mod.iconBg}`}>
                            {mod.icon}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${mod.statusColor}`}>
                            {mod.statusLabel}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-purple transition-colors">{mod.title}</h3>
                    <p className="text-sm text-gray-500 mb-6 flex-1 leading-relaxed">{mod.detail}</p>

                    {mod.dualAction && mod.actions ? (
                        <div className="flex gap-2">
                            {mod.actions.map((action, aIdx) => (
                                <button
                                    key={aIdx}
                                    onClick={() => onNavigate(action.target)}
                                    className="flex-1 py-3 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-700 hover:bg-brand-text hover:text-white hover:border-brand-text transition-all flex items-center justify-center gap-1 group-hover:shadow-sm"
                                >
                                    <span>{action.icon}</span> {action.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <button
                            onClick={() => onNavigate(mod.target as FocusMode)}
                            className="w-full py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-bold text-gray-700 hover:bg-brand-text hover:text-white hover:border-brand-text transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                        >
                            {mod.actionLabel}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};


const UserDashboard: React.FC<UserDashboardProps> = ({ onSignOut, patient, onUpdatePatient, userName }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentView, setCurrentView] = useState<DashboardView>('live');
    const [focusMode, setFocusMode] = useState<FocusMode>('none');

    // Profile Check
    const profileStatus = useMemo(() => {
        const missing: string[] = [];
        if (!patient.phone) missing.push("Phone Number");
        if (!patient.shippingAddress.line1) missing.push("Shipping Address");
        return {
            isComplete: missing.length === 0,
            missingFields: missing
        };
    }, [patient]);

    // Calculate logic for scheduling restrictions (e.g. Consult after Labs)
    const minConsultDate = useMemo(() => {
        // Find the latest Lab Schedule
        const labEvent = patient.timeline.find(e => e.type === 'Labs' && e.title.includes('Scheduled'));
        if (labEvent) {
            const labDateStr = labEvent.context?.labDateTime || labEvent.date;
            // Try to parse the date from context "September 18, 2024, 10:00 AM" or fallback to event date
            // Removing time part for safer parsing if needed, but JS Date handles it well usually
            const labDate = new Date(labDateStr);
            if (!isNaN(labDate.getTime())) {
                const minDate = new Date(labDate);
                minDate.setDate(minDate.getDate() + 5); // Add 5 days
                return minDate;
            }
        }
        return undefined;
    }, [patient.timeline]);


    // --- Handlers for Focus Views ---

    const handleActionCenterClick = (actionType: 'schedule_consult' | 'schedule_labs' | 'track_shipment' | 'join_call' | 'complete_profile' | 'log_progress' | 'start_intake') => {
        if (actionType === 'log_progress') {
            const progressSection = document.getElementById('treatment-progress-section');
            if (progressSection) progressSection.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        switch (actionType) {
            case 'schedule_consult': setFocusMode('schedule_consult'); break;
            case 'schedule_labs': setFocusMode('schedule_labs'); break;
            case 'join_call': setFocusMode('telehealth'); break;
            case 'track_shipment': setFocusMode('view_plan'); break;
            case 'complete_profile': setCurrentView('profile'); break;
            case 'start_intake': setCurrentView('live'); break;
        }
    };

    const handleModuleNavigate = (target: FocusMode) => {
        setFocusMode(target);
    };

    const closeFocusMode = () => setFocusMode('none');

    // --- Task Completion Handlers ---

    const handleMedicalHistoryComplete = (data: any) => {
        const intakeEvent: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Assessment',
            title: 'Digital Data Intake Completed',
            description: 'Patient updated medical history via profiler.'
        };

        const patientUpdates: Partial<Patient> = {
            ...data,
            age: data.age ? Number(data.age) : patient.age,
            status: 'Assessment Review',
            nextAction: 'Doctor Review Pending'
        };

        // Update goal if goal_weight is provided
        if (data.goal_weight) {
            const currentWeightKg = Number(data.current_weight || 0);
            const goalWeightKg = Number(data.goal_weight);
            if (currentWeightKg > 0) {
                const loseLbs = Math.round((currentWeightKg - goalWeightKg) * 2.20462);
                patientUpdates.goal = `Lose ${loseLbs} lbs`;
            }
        }

        // Extract vitals if present
        if (data.current_weight || (data.height_ft && data.height_in)) {
            const newVitals = [...patient.vitals];
            const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            let weightLbs = 0;
            let heightMeters = 0;

            if (data.current_weight) {
                const kg = Number(data.current_weight);
                weightLbs = Math.round(kg * 2.20462);
                newVitals.push({
                    label: 'Weight',
                    value: weightLbs.toString(),
                    unit: 'lbs',
                    trend: 'stable',
                    date: today
                });
            }

            if (data.height_ft && data.height_in) {
                const feet = Number(data.height_ft);
                const inches = Number(data.height_in);
                heightMeters = (feet * 12 + inches) * 0.0254;
                newVitals.push({
                    label: 'Height',
                    value: `${feet}'${inches}"`,
                    date: today
                });
            }

            // Calculate BMI
            if (weightLbs > 0 && heightMeters > 0) {
                const kg = Number(data.current_weight);
                const bmi = (kg / (heightMeters * heightMeters)).toFixed(1);
                newVitals.push({
                    label: 'BMI',
                    value: bmi,
                    trend: 'stable',
                    date: today
                });
            }

            if (data.waist) {
                newVitals.push({ label: 'Waist', value: data.waist, unit: 'in', date: today });
            }
            patientUpdates.vitals = newVitals;
        }

        onUpdatePatient(patient.id, intakeEvent, patientUpdates);
        closeFocusMode();
    };

    const handlePsychProfileComplete = (data: any) => {
        const intakeEvent: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Assessment',
            title: 'Psychographic Profile Completed',
            description: 'Patient completed psychometric assessments (PHQ-9, BES, EAT-26).'
        };
        onUpdatePatient(patient.id, intakeEvent, { ...data });
        closeFocusMode();
    };

    const handleLabScheduled = (dateTime: { date: Date; time: string }) => {
        const formattedDateTime = `${dateTime.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${dateTime.time}`;
        const labEvent: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Labs',
            title: 'Root-Cause Labs Scheduled',
            description: `Patient scheduled comprehensive metabolic labs. Results pending.`,
            context: { labDateTime: formattedDateTime },
            documentId: 'REQ-24-001'
        };
        onUpdatePatient(patient.id, labEvent, {
            status: 'Ready for Consult',
            nextAction: 'Schedule Doctor Consultation',
            tracking: {
                ...patient.tracking,
                labs: { status: 'booked', date: formattedDateTime, ...labEvent.context }
            }
        });
        closeFocusMode();
    };

    const handleConsultScheduled = (dateTime: { date: Date; time: string }) => {
        const formattedDateTime = `${dateTime.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${dateTime.time}`;
        const consultEvent: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Consultation',
            title: 'Consultation Scheduled',
            description: `Video review scheduled with ${patient.careTeam.physician}.`,
            context: {
                consultDateTime: formattedDateTime,
                meetingLink: 'https://meet.google.com/vita-health-consult'
            }
        };
        onUpdatePatient(patient.id, consultEvent, {
            status: 'Consultation Scheduled',
            nextAction: `Attend call on ${formattedDateTime}`,
            tracking: {
                ...patient.tracking,
                consultation: { status: 'booked', date: formattedDateTime, ...consultEvent.context }
            }
        });
        closeFocusMode();
    };

    const handleEndCall = () => {
        const transcriptEvent = {
            type: 'Consultation',
            title: 'Metabolic Fingerprint Review',
            description: 'Doctor reviewed metabolic profile. Patient cleared for GLP-1 therapy + MuscleProtect protocol.',
            doctor: patient.careTeam.physician,
        } as const;
        onUpdatePatient(patient.id, transcriptEvent, { status: 'Awaiting Shipment', nextAction: 'Medication Shipment' });
        closeFocusMode();
    };

    // --- Renderers ---

    if (currentView === 'live') {
        return (
            <PatientLive
                patient={patient}
                onNavigate={(view: any) => setCurrentView(view)}
                onUpdatePatient={onUpdatePatient}
                onSignOut={onSignOut}
            />
        );
    }

    const renderFocusContent = () => {
        switch (focusMode) {
            case 'intake_medical_ai':
                return (
                    <MedicalProfiler
                        patient={patient}
                        onClose={closeFocusMode}
                        onComplete={handleMedicalHistoryComplete}
                    />
                );
            case 'intake_psych_ai':
                return (
                    <PsychoProfiler
                        patient={patient}
                        onClose={closeFocusMode}
                        onComplete={handlePsychProfileComplete}
                    />
                );
            default: return null;
        }
    };

    if (focusMode === 'intake_medical_ai' || focusMode === 'intake_psych_ai') {
        return renderFocusContent();
    }

    const renderDashboardHome = () => {
        return (
            <div className="animate-fade-in">
                {/* 1. Overview Hero */}
                <PatientOverviewHero
                    patient={patient}
                    isProfileComplete={profileStatus.isComplete}
                    missingFields={profileStatus.missingFields}
                    onOpenChat={() => setCurrentView('live')}
                />

                {/* 2. Live Lounge CTA */}
                <div className="mb-8 p-1 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan rounded-3xl shadow-xl hover:shadow-2xl transition-all group cursor-pointer" onClick={() => setCurrentView('live')}>
                    <div className="bg-white rounded-[22px] p-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center text-3xl shadow-inner border border-gray-50 relative">
                                🎙️
                                <div className="absolute top-0 right-0 w-4 h-4 bg-brand-cyan rounded-full border-2 border-white animate-ping"></div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 leading-tight">Enter Live Lounge</h3>
                                <p className="text-sm text-gray-500 font-medium">Complete onboarding and chat with specialists.</p>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-brand-purple text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                    </div>
                </div>

                {/* 3. Action Center (The Hub) */}
                <div className="mb-8">
                    <PatientActionCenter
                        patient={patient}
                        onAction={handleActionCenterClick}
                        profileStatus={profileStatus}
                    />
                </div>

                {/* 4. Care Modules Grid (The Spokes) */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 pl-1">Your Care Modules</h2>
                    <CareModulesGrid patient={patient} onNavigate={handleModuleNavigate} />
                </div>

                {/* 5. Treatment Progress Section (Below Grid, Accordion Style) */}
                <div id="treatment-progress-section">
                    <TreatmentProgressSection patient={patient} onUpdatePatient={onUpdatePatient} />
                </div>
            </div>
        );
    };

    const renderMainContent = () => {
        switch (currentView) {
            case 'dashboard': return renderDashboardHome();
            case 'profile': return <MyProfileScreen patient={patient} onUpdatePatient={onUpdatePatient} />;
            case 'reports': return <ReportsScreen patient={patient} />;
            case 'payments': return <PaymentsScreen />;
            case 'care_team': return <CareTeamScreen patient={patient} onSendMessage={() => setCurrentView('messages')} />;
            case 'messages': return <PatientMessagesScreen patient={patient} />;
            case 'help': return <HelpScreen />;
            default: return renderDashboardHome();
        }
    }

    return (
        <div className="min-h-screen bg-brand-bg">
            <UserHeader onOpenMenu={() => setIsMenuOpen(true)} onGoHome={() => { setCurrentView('dashboard'); setFocusMode('none'); }} userName={userName} />
            <SideMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onSignOut={onSignOut}
                onNavigate={(view) => { setCurrentView(view); setIsMenuOpen(false); setFocusMode('none'); }}
                currentView={currentView}
            />
            <main className="py-8 sm:py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    {renderMainContent()}
                </div>
            </main>

            {/* Modals for specific sub-tasks */}
            <ModalWrapper
                isOpen={focusMode === 'schedule_consult'}
                onClose={closeFocusMode}
                title="Schedule Consultation"
            >
                <ConsultationScheduler
                    onSchedule={handleConsultScheduled}
                    minBookingNoticeDays={2}
                    minDate={minConsultDate}
                    buttonText="Confirm Appointment"
                />
            </ModalWrapper>

            <ModalWrapper
                isOpen={focusMode === 'schedule_labs'}
                onClose={closeFocusMode}
                title="Book Lab Visit"
            >
                <LabScheduler onSchedule={handleLabScheduled} />
            </ModalWrapper>

            <ModalWrapper
                isOpen={focusMode === 'telehealth'}
                onClose={closeFocusMode}
                title="Telehealth Session"
            >
                <FirstDoseCall onCallEnd={handleEndCall} doctorName={patient.careTeam.physician} />
            </ModalWrapper>

            <ModalWrapper
                isOpen={focusMode === 'view_plan'}
                onClose={closeFocusMode}
                title="Treatment Plan Details"
                maxWidth="max-w-xl"
            >
                <PrescriptionView patient={patient} />
            </ModalWrapper>

            {/* Form Modals */}
            <ModalWrapper
                isOpen={focusMode === 'intake_medical_form'}
                onClose={closeFocusMode}
                title="Medical History Form"
                maxWidth="max-w-2xl"
            >
                <DigitalIntake
                    onComplete={handleMedicalHistoryComplete}
                    initialSection="vitals"
                />
            </ModalWrapper>

            <ModalWrapper
                isOpen={focusMode === 'intake_psych_form'}
                onClose={closeFocusMode}
                title="Psychographic Assessment"
                maxWidth="max-w-2xl"
            >
                <DigitalIntake
                    onComplete={handlePsychProfileComplete}
                    initialSection="phq9"
                />
            </ModalWrapper>

        </div>
    );
};

export default UserDashboard;
