
import React from 'react';
import { Patient, TimelineEvent } from '../../constants';

interface PatientActionCenterProps {
    patient: Patient;
    onAction: (actionType: 'schedule_consult' | 'schedule_labs' | 'track_shipment' | 'join_call' | 'complete_profile' | 'log_progress' | 'start_intake') => void;
    profileStatus?: { isComplete: boolean; missingFields: string[] };
}

interface TaskItem {
    id: string;
    type: 'doctor_order' | 'medical_alert' | 'routine_task' | 'info';
    category: 'Test' | 'Rx' | 'Consult' | 'Profile' | 'Routine' | 'Intake' | 'Alert';
    title: string;
    description: React.ReactNode;
    icon: React.ReactNode;
    actionLabel: string;
    actionType: 'schedule_consult' | 'schedule_labs' | 'track_shipment' | 'join_call' | 'complete_profile' | 'log_progress' | 'start_intake';
    dueDate?: string;
    doctorName?: string;
    isUrgent?: boolean;
    timestamp: Date;
}

// Helper to calculate due date based on natural language timeframe
const calculateDueDate = (requestDateStr: string, timeframe: string): string => {
    const requestDate = new Date(requestDateStr);
    let daysToAdd = 7; // default
    
    const lowerTimeframe = timeframe.toLowerCase();
    if (lowerTimeframe.includes('asap') || lowerTimeframe.includes('urgent')) daysToAdd = 2;
    else if (lowerTimeframe.includes('1 week')) daysToAdd = 7;
    else if (lowerTimeframe.includes('2 weeks')) daysToAdd = 14;
    else if (lowerTimeframe.includes('3 weeks')) daysToAdd = 21;
    else if (lowerTimeframe.includes('1 month') || lowerTimeframe.includes('4 weeks')) daysToAdd = 30;
    
    const dueDate = new Date(requestDate);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Unified Card Component matching Care Coordinator "Active Task" style
const ActiveTaskCard: React.FC<{ task: TaskItem; onAction: () => void }> = ({ task, onAction }) => {
    const isDoctorOrder = task.type === 'doctor_order';
    
    const typeStyles: Record<string, { bg: string; border: string; text: string; iconBg: string; btn: string }> = {
        'Test': { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-900', iconBg: 'bg-blue-100 text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' },
        'Rx': { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-900', iconBg: 'bg-purple-100 text-purple-600', btn: 'bg-brand-purple hover:bg-brand-purple/90' },
        'Consult': { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-900', iconBg: 'bg-green-100 text-green-600', btn: 'bg-green-600 hover:bg-green-700' },
        'Profile': { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-900', iconBg: 'bg-orange-100 text-orange-600', btn: 'bg-orange-600 hover:bg-orange-700' },
        'Intake': { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-900', iconBg: 'bg-teal-100 text-teal-600', btn: 'bg-teal-600 hover:bg-teal-700' },
        'Routine': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', iconBg: 'bg-gray-200 text-gray-500', btn: 'bg-gray-800 hover:bg-gray-900' },
        'Alert': { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-900', iconBg: 'bg-red-100 text-red-600', btn: 'bg-red-600 hover:bg-red-700' }
    };

    const s = typeStyles[task.category] || typeStyles['Routine'];
    const isJoinCall = task.actionType === 'join_call';

    return (
        <div className="flex gap-4 relative group animate-fade-in">
            {/* Timeline Connector */}
            <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm border-2 border-white ${s.iconBg}`}>
                    {task.icon}
                </div>
                <div className="w-0.5 flex-1 bg-gray-100 my-1 group-last:hidden"></div>
            </div>

            <div className="flex-1 pb-6">
                <div className={`rounded-xl border shadow-sm p-5 transition-all duration-300 hover:shadow-md ${s.bg} ${s.border}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/60 ${s.text}`}>
                                    {task.category}
                                </span>
                                {isDoctorOrder && (
                                    <span className="text-[10px] font-bold bg-brand-text text-white px-2 py-0.5 rounded flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Doctor Request
                                    </span>
                                )}
                                {task.dueDate && (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                        Due: {task.dueDate}
                                    </span>
                                )}
                            </div>
                            
                            <h4 className={`text-lg font-bold ${s.text}`}>{task.title}</h4>
                            <div className="text-sm text-gray-600 mt-2 leading-relaxed">
                                {task.description}
                            </div>
                            
                            {task.doctorName && (
                                <p className="text-xs text-gray-500 mt-3 font-medium flex items-center gap-1">
                                    Requested by: <span className="text-gray-900">{task.doctorName}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <button 
                                onClick={onAction}
                                className={`w-full sm:w-auto px-6 py-3 text-sm font-bold text-white rounded-xl shadow-md transition-transform active:scale-95 whitespace-nowrap flex items-center justify-center gap-2 ${isJoinCall ? 'bg-green-600 hover:bg-green-500 animate-pulse' : s.btn}`}
                            >
                                {isJoinCall && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                                {task.actionLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PatientActionCenter: React.FC<PatientActionCenterProps> = ({ patient, onAction, profileStatus }) => {
    const tasks: TaskItem[] = [];

    // Helper to check if a request event has been resolved by a later event
    const isResolved = (requestDateStr: string, resolutions: TimelineEvent[]) => {
        const requestDate = new Date(requestDateStr);
        return resolutions.some(res => new Date(res.date) >= requestDate);
    };

    // Helper to check history
    const hasCompletedIntake = patient.timeline.some(e => e.type === 'Assessment' || e.title === 'Digital Intake Completed');
    const hasPriorLabs = patient.timeline.some(e => e.type === 'Labs' && (e.title.includes('Results') || e.title.includes('Reviewed')));
    const hasPriorShipment = patient.timeline.some(e => e.type === 'Shipment');

    // --- 0. STATUS CHECKS (Context Aware) ---
    
    // CASE A: Action Required
    if (patient.status === 'Action Required') {
        if (!hasCompletedIntake) {
            // True Onboarding Intake
            tasks.push({
                id: 'intake_required',
                type: 'routine_task',
                category: 'Intake',
                title: "Action Required: Complete Intake",
                description: "To create your personalized metabolic profile, please complete your medical assessment.",
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
                actionLabel: 'Start Intake',
                actionType: 'start_intake',
                isUrgent: true,
                timestamp: new Date()
            });
        } else {
            // Mid-cycle Clinical Alert (e.g. Flagged by Doctor)
            tasks.push({
                id: 'clinical_alert',
                type: 'medical_alert',
                category: 'Alert',
                title: "Clinical Attention Needed",
                description: patient.nextAction || "Your doctor has flagged an item for review. Please check your messages.",
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
                actionLabel: 'View Plan', // Redirects to a safe place, or ideally messages if that action existed in props
                actionType: 'track_shipment', 
                isUrgent: true,
                timestamp: new Date()
            });
        }
    }

    // --- 1. LABS (Test) ---
    const labOrders = patient.timeline.filter(e => e.type === 'Labs' && (e.title.includes('Ordered') || e.description.includes('Ordered') || e.description.includes('Required')));
    const labResolutions = patient.timeline.filter(e => e.type === 'Labs' && (e.title.includes('Scheduled') || e.title.includes('Results') || e.title.includes('Reviewed')));

    labOrders.forEach((order, index) => {
        if (!isResolved(order.date, labResolutions)) {
            let labDetails = order.description.replace('Ordered: ', '').replace('Coordinator ordered:', '').trim() || "Comprehensive Metabolic Panel";
            
            // Contextual Text
            const title = hasPriorLabs ? "New Diagnostic Request" : "Root-Cause Labs Required";
            const desc = hasPriorLabs 
                ? `Your doctor has ordered a new test: ${labDetails}. Please schedule a visit.`
                : `Order for: ${labDetails}. Please visit a partner lab to complete this request.`;

            tasks.push({
                id: `lab_order_${order.id}_${index}`,
                type: 'doctor_order',
                category: 'Test',
                title: title,
                description: desc,
                doctorName: order.doctor || patient.careTeam.physician,
                dueDate: calculateDueDate(order.date, '2 weeks'),
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
                actionLabel: 'Book Lab Visit',
                actionType: 'schedule_labs',
                timestamp: new Date(order.date)
            });
        }
    });

    if (tasks.filter(t => t.category === 'Test').length === 0 && (patient.status === 'Labs Ordered' || patient.status === 'Additional Testing Required')) {
         tasks.push({
            id: 'lab_status_fallback',
            type: 'doctor_order',
            category: 'Test',
            title: hasPriorLabs ? "Additional Testing Required" : "Root-Cause Labs Required",
            description: hasPriorLabs 
                ? "New diagnostics are needed to adjust your treatment plan."
                : "A comprehensive panel is required to proceed with your treatment plan.",
            doctorName: patient.careTeam.physician,
            dueDate: calculateDueDate(new Date().toISOString(), '1 week'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
            actionLabel: 'Book Lab Visit',
            actionType: 'schedule_labs',
            timestamp: new Date()
        });
    }


    // --- 2. Rx (Medication & Protocol) ---
    // A Protocol update is generally "resolved" when the Shipment is sent or treatment starts.
    const protocolUpdates = patient.timeline.filter(e => e.type === 'Protocol');
    const shipmentEvents = patient.timeline.filter(e => e.type === 'Shipment');

    protocolUpdates.forEach((proto, index) => {
        // If there's a shipment AFTER the protocol update, we consider the "View Plan" task done/outdated.
        if (!isResolved(proto.date, shipmentEvents)) {
            tasks.push({
                id: `protocol_${proto.id}_${index}`,
                type: 'doctor_order',
                category: 'Rx',
                title: proto.title || "Medication Update",
                description: `Protocol Update: ${proto.description}. Please review your new plan.`,
                doctorName: proto.doctor || patient.careTeam.physician,
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                actionLabel: 'View Treatment Plan',
                actionType: 'track_shipment', // This links to the Treatment Plan view
                timestamp: new Date(proto.date)
            });
        }
    });

    // Fallback Rx if status is shipping (initial) and no protocol event AND no recent shipment
    // If status is 'Awaiting Shipment', implies pending.
    if (tasks.filter(t => t.category === 'Rx').length === 0 && patient.status === 'Awaiting Shipment') {
         tasks.push({
            id: 'rx_shipping_fallback',
            type: 'doctor_order',
            category: 'Rx',
            title: hasPriorShipment ? "Refill / Adjustment Processing" : "Medication Processing",
            description: hasPriorShipment 
                ? `Your adjustment/refill of ${patient.currentPrescription.name} is being prepared for shipment.`
                : `Your monthly refill of ${patient.currentPrescription.name} is being processed.`,
            doctorName: patient.careTeam.physician,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            actionLabel: 'View Treatment Plan',
            actionType: 'track_shipment',
            timestamp: new Date()
        });
    }


    // --- 3. Consult (Consultation) ---
    // A. Unresolved Requests (Doctor said "Book this")
    const consultRequests = patient.timeline.filter(e => e.title === 'Consult Requested' || e.title === 'Follow-up Required');
    const consultResolutions = patient.timeline.filter(e => e.title === 'Consultation Scheduled' || e.title === 'Consultation Completed' || e.title.includes('Review'));

    consultRequests.forEach((req, index) => {
        if (!isResolved(req.date, consultResolutions)) {
            let timeframe = 'ASAP';
            if (req.description) {
                const tfMatch = req.description.match(/Timeframe: (.*?)(?:\.|$)/);
                if (tfMatch) timeframe = tfMatch[1];
            }
            tasks.push({
                id: `consult_req_${req.id}_${index}`,
                type: 'doctor_order',
                category: 'Consult',
                title: "Follow-up Requested",
                description: `Your doctor requested a follow-up (${timeframe}). Please book a slot.`,
                doctorName: req.doctor || patient.careTeam.physician,
                dueDate: calculateDueDate(req.date, timeframe),
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
                actionLabel: 'Book Consultation',
                actionType: 'schedule_consult',
                timestamp: new Date(req.date)
            });
        }
    });

    // B. Scheduled Calls (Upcoming)
    // Only show if NOT completed
    const scheduledConsults = patient.timeline.filter(e => e.title === 'Consultation Scheduled');
    const completions = patient.timeline.filter(e => e.title.includes('Review') || e.title.includes('Completed'));
    
    scheduledConsults.forEach((sc, index) => {
        if (!isResolved(sc.date, completions)) {
             tasks.push({
                id: `consult_scheduled_${sc.id}_${index}`,
                type: 'doctor_order',
                category: 'Consult',
                title: "Upcoming Consultation",
                description: `Video visit scheduled for ${sc.context?.consultDateTime || sc.date}. Tap to join.`,
                doctorName: sc.doctor || patient.careTeam.physician,
                dueDate: sc.context?.consultDateTime,
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
                actionLabel: 'Join Video Call',
                actionType: 'join_call',
                timestamp: new Date(sc.date)
            });
        }
    });

    // Fallback Consult
    if (tasks.filter(t => t.category === 'Consult').length === 0 && (patient.status === 'Follow-up Required' || patient.status === 'Ready for Consult')) {
         tasks.push({
            id: 'consult_fallback',
            type: 'doctor_order',
            category: 'Consult',
            title: patient.status === 'Ready for Consult' ? "Book Doctor Consultation" : "Consultation Required",
            description: "Please schedule a time to speak with your doctor to review your progress.",
            doctorName: patient.careTeam.physician,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
            actionLabel: 'Book Consultation',
            actionType: 'schedule_consult',
            timestamp: new Date()
        });
    }


    // --- 4. Profile ---
    if (profileStatus && !profileStatus.isComplete) {
        tasks.push({
            id: 'complete_profile',
            type: 'info',
            category: 'Profile',
            title: "Complete Your Profile",
            description: `Missing info: ${profileStatus.missingFields.join(', ')}. Required for shipping.`,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            actionLabel: 'Update Profile',
            actionType: 'complete_profile',
            timestamp: new Date()
        });
    }

    // --- 5. Routine Log ---
    // Only show if no logs exist for the current cycle/week (simplified check)
    const hasRecentLog = patient.weeklyLogs && patient.weeklyLogs.length > 0;
    
    if (['Ongoing Treatment', 'Monitoring Loop'].includes(patient.status) && !hasRecentLog) {
        tasks.push({
            id: 'log_progress',
            type: 'routine_task',
            category: 'Routine',
            title: "Weekly Check-in",
            description: "Log your weight and any side effects to keep your care team informed.",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
            actionLabel: 'Log Now',
            actionType: 'log_progress',
            timestamp: new Date()
        });
    }

    if (tasks.length === 0) return (
        <div className="mb-10 text-center py-8 bg-white border border-gray-200 border-dashed rounded-2xl">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="font-bold text-gray-900">All caught up!</h3>
            <p className="text-sm text-gray-500">You have no pending actions at this time.</p>
        </div>
    );

    // Prioritize Urgent, then Doctor Orders, then timestamp
    const sortedTasks = tasks.sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        
        // Priority 1: Category Importance
        const priorityOrder: Record<string, number> = { 'Alert': 0, 'Intake': 1, 'Consult': 2, 'Test': 3, 'Rx': 4, 'Profile': 5, 'Routine': 6 };
        if (priorityOrder[a.category] !== priorityOrder[b.category]) {
            return priorityOrder[a.category] - priorityOrder[b.category];
        }
        // Priority 2: Timestamp (Newest first)
        return b.timestamp.getTime() - a.timestamp.getTime();
    });

    return (
        <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Action Center <span className="bg-brand-purple text-white text-xs font-bold px-2 py-1 rounded-full">{tasks.length}</span>
            </h3>
            <div className="space-y-4">
                {sortedTasks.map(task => (
                    <ActiveTaskCard key={task.id} task={task} onAction={() => onAction(task.actionType)} />
                ))}
            </div>
        </div>
    );
};

export default PatientActionCenter;
