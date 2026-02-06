import { Patient, IntakeIcon, LabsIcon, ConsultIcon, TreatmentIcon, MonitoringIcon } from '../../constants';

interface CareProcessTrackerProps {
    patient: Patient;
}

const CareProcessTracker: React.FC<CareProcessTrackerProps> = ({ patient }) => {
    const currentStatus = patient.status || 'Action Required';
    const tracking = patient.tracking || {};
    const labs = tracking.labs || {};
    const consult = tracking.consultation || {};

    const steps = [
        { id: 'intake', label: 'Intake', icon: <IntakeIcon /> },
        { id: 'labs', label: 'Metabolic', icon: <LabsIcon /> },
        { id: 'clinical', label: 'Clinical', icon: <ConsultIcon /> },
        { id: 'pharmacy', label: 'Pharmacy', icon: <TreatmentIcon /> },
        { id: 'care', label: 'Care Loop', icon: <MonitoringIcon /> },
    ];

    // Map specific statuses to step indices (0-4)
    let activeIndex = 0;

    // 1. Terminal / Advanced States
    if (['Ongoing Treatment', 'Monitoring Loop'].includes(currentStatus)) {
        activeIndex = 4;
    } else if (['Awaiting Shipment', 'Pharmacy Review'].includes(currentStatus)) {
        activeIndex = 3;
    }
    // 2. Data Driven States (Check subcollections status)
    else if (consult.date && consult.status !== 'completed') {
        activeIndex = 2; // Clinical
    } else if (labs.date && labs.status !== 'completed') {
        activeIndex = 1; // Metabolic
    }
    // 3. Transition States
    else if (labs.status === 'completed' && (!consult.status || consult.status !== 'completed')) {
        activeIndex = 2; // Ready for clinical
    } else if (consult.status === 'completed') {
        activeIndex = 3; // Ready for pharmacy
    }
    // 4. Default Intake Fallback
    else {
        if (['Labs Ordered', 'Awaiting Lab Confirmation', 'Awaiting Lab Results'].includes(currentStatus)) activeIndex = 1;
        else if (['Ready for Consult', 'Consultation Scheduled'].includes(currentStatus)) activeIndex = 2;
        else activeIndex = 0;
    }

    return (
        <div className="mb-10 px-2">
            <div className="flex items-center justify-between relative">
                {/* Connecting Line Background */}
                <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>

                {/* Progress Line */}
                <div
                    className="absolute left-0 top-1/2 h-1 bg-brand-purple -z-0 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isActive = index === activeIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 ${isActive
                                ? 'bg-white border-brand-purple shadow-[0_0_0_4px_rgba(192,132,252,0.2)] scale-110'
                                : isCompleted
                                    ? 'bg-brand-purple border-brand-purple text-white'
                                    : 'bg-white border-gray-200 text-gray-300'
                                }`}>
                                {isCompleted ? (
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'grayscale opacity-50'}`}>
                                        {step.icon}
                                    </div>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold uppercase mt-2 tracking-wider ${isActive ? 'text-brand-purple' : isCompleted ? 'text-gray-600' : 'text-gray-300'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Context Banner */}
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse"></span>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Status</p>
                </div>
                <span className="text-sm font-bold text-brand-purple">{currentStatus}</span>
            </div>
        </div>
    );
};

export default CareProcessTracker;
