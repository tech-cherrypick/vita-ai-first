import { Patient, IntakeIcon, LabsIcon, ConsultIcon, TreatmentIcon, MonitoringIcon } from '../../constants';

interface CareProcessTrackerProps {
    patient: Patient;
}

const CareProcessTracker: React.FC<CareProcessTrackerProps> = ({ patient }) => {
    const currentStatus = patient.status || 'Action Required';
    const tracking = patient.tracking || {};
    const history = patient.patient_history || [];

    // Calculate Loop Number based on how many shipments were delivered
    const completedLoops = history.filter(e => e.type === 'Shipment' && e.title?.includes('Delivered')).length;
    const currentLoop = completedLoops + 1;

    const currentLoopData = patient.current_loop || {};
    const labsStatus = currentLoopData.labs?.status || tracking.labs?.status;
    const consultStatus = currentLoopData.consultation?.status || tracking.consultation?.status;
    const shipmentStatus = currentLoopData.shipment?.status || tracking.shipment?.status;

    const steps = [
        { id: 'intake', label: 'Intake', icon: <IntakeIcon /> },
        { id: 'labs', label: 'Metabolic', icon: <LabsIcon /> },
        { id: 'clinical', label: 'Clinical', icon: <ConsultIcon /> },
        { id: 'pharmacy', label: 'Pharmacy', icon: <TreatmentIcon /> },
        { id: 'care', label: 'Care Loop', icon: <MonitoringIcon /> },
    ];

    // Map specific statuses to step indices (0-4) using persistent current_loop state
    let activeIndex = 0;

    const s_current = (currentStatus || '').toLowerCase();
    const s_labs = (labsStatus || '').toLowerCase();
    const s_consult = (consultStatus || '').toLowerCase();
    const s_shipment = (shipmentStatus || '').toLowerCase();

    if (['ongoing treatment', 'monitoring loop'].includes(s_current) || s_shipment === 'delivered') {
        activeIndex = 4; // Care Loop
    } else if (['awaiting shipment', 'shipped'].includes(s_shipment) || s_consult === 'completed' || s_current === 'awaiting shipment') {
        activeIndex = 3; // Pharmacy
    } else if (['ready for consult', 'consultation scheduled', 'consultation'].includes(s_current) || s_labs === 'completed' || s_consult === 'scheduled') {
        activeIndex = 2; // Clinical
    } else if (['assessment review', 'labs ordered', 'awaiting lab results', 'awaiting lab confirmation'].includes(s_current) ||
        ['booked', 'ordered', 'ongoing', 'awaiting lab results'].includes(s_labs)) {
        activeIndex = 1; // Metabolic
    } else {
        activeIndex = 0; // Intake
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
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse"></span>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Status</p>
                    </div>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-1.5 bg-brand-purple/10 px-2 py-0.5 rounded-md">
                        <span className="text-[10px] font-black text-brand-purple uppercase">Loop {currentLoop}</span>
                    </div>
                </div>
                <span className="text-sm font-bold text-brand-purple">{currentStatus}</span>
            </div>
        </div>
    );
};

export default CareProcessTracker;
