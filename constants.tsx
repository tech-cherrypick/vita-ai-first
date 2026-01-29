
import React from 'react';

// --- Branding ---
export const VitaLogo = () => (
    <h1 className="text-3xl font-black tracking-tighter text-brand-text">
        vita<span className="text-brand-purple">+</span>
    </h1>
);

// --- Shared Icons ---
export const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const MenuSignOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

// --- Timeline Icons ---
export const TimelineVideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
export const TimelineDocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
export const TimelineClipboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
export const TimelineNoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
export const TimelineShipmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
export const TimelineProtocolIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

// --- Landing Page Icons ---
export const BrainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-brand-cyan mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
export const GutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-brand-purple mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
export const MetabolismIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-brand-pink mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

// How It Works Icons
const HowItWorksIconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-16 h-16 bg-brand-pink/10 rounded-2xl flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-brand-pink/20 rounded-xl flex items-center justify-center">
            {children}
        </div>
    </div>
);

export const IntakeIcon = () => <HowItWorksIconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#E94057" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></HowItWorksIconWrapper>;
export const LabsIcon = () => <HowItWorksIconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#E94057" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg></HowItWorksIconWrapper>;
export const ConsultIcon = () => <HowItWorksIconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#E94057" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg></HowItWorksIconWrapper>;
export const TreatmentIcon = () => <HowItWorksIconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#E94057" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg></HowItWorksIconWrapper>;
export const MonitoringIcon = () => <HowItWorksIconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#E94057" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg></HowItWorksIconWrapper>;

export const FdaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
export const DoctorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
export const SupportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-brand-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

export const safetyFeatures = [
    { title: 'CDSCO & FDA Approved', description: 'We only prescribe GLP-1 medications that are approved for chronic weight management in India.', icon: <FdaIcon /> },
    { title: 'Doctor Supervised', description: 'You are matched with a licensed endocrinologist or metabolic specialist for your entire journey.', icon: <DoctorIcon /> },
    { title: '24/7 Care Team', description: 'Questions? Side effects? Our Indian medical support team is available around the clock.', icon: <SupportIcon /> },
    { title: 'Secure & Private', description: 'Your health data is encrypted and compliant with Indian Digital Health standards.', icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2.33325L3.5 7.00002V12.8334C3.5 19.32 7.96833 25.3283 14 26.8333C20.0317 25.3283 24.5 19.32 24.5 12.8334V7.00002L14 2.33325ZM11.6667 18.6666L8.16667 15.1666L9.81167 13.5216L11.6667 15.365L18.1883 8.84335L19.8333 10.5L11.6667 18.6666Z" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
];

export const howItWorksSteps = [
    { step: 'Step 1', title: 'Medical Intake', description: 'Complete a 5-minute digital assessment about your health history and weight loss goals.', icon: <IntakeIcon /> },
    { step: 'Step 2', title: 'Lab Diagnostics', description: 'We order a comprehensive metabolic panel to check your thyroid, insulin, and organ function.', icon: <LabsIcon /> },
    { step: 'Step 3', title: 'Doctor Consult', description: 'Video consultation with an expert endocrinologist to review your results and prescribe medication.', icon: <ConsultIcon /> },
    { step: 'Step 4', title: 'Receive Meds', description: 'Your GLP-1 medication is shipped overnight in cold-chain packaging directly to your door.', icon: <TreatmentIcon /> },
    { step: 'Step 5', title: 'Ongoing Care', description: 'Weekly check-ins, nutrition coaching, and dosage adjustments to ensure safe, steady progress.', icon: <MonitoringIcon /> },
];

export const faqItems = [
    { question: 'What is GLP-1 therapy?', answer: 'GLP-1 receptor agonists are a class of medications that mimic a naturally occurring hormone in your body that regulates appetite and blood sugar. They are clinically proven to help with chronic weight management.' },
    { question: 'Is this available in my city?', answer: 'We are currently operational in all major Tier 1 and Tier 2 cities across India, including Mumbai, Delhi NCR, Bangalore, Hyderabad, Chennai, and Pune.' },
    { question: 'Do I need insurance?', answer: 'No, insurance is not required. Our plans are comprehensive self-pay packages. Some insurers may cover the cost of medication, which we can help facilitate.' },
    { question: 'Are the medications authentic?', answer: 'Absolutely. We partner directly with authorized distributors of Novo Nordisk and Eli Lilly in India to ensure 100% authenticity and cold-chain integrity.' },
    { question: 'What if I have side effects?', answer: 'Mild side effects are common. Your care team will provide a supportive protocol (dietary adjustments, anti-nausea meds) to manage them effectively.' },
];

export const patientFaqItems = [
    {
        category: 'Treatment',
        icon: '💊',
        faqs: [
            { question: 'When will I see results?', answer: 'Most patients start seeing weight loss within the first 4 weeks. Significant metabolic changes often happen before the scale moves.' },
            { question: 'Can I travel with my pen?', answer: 'Yes. Keep it cool (2°C to 8°C) until first use. Once in use, it can be kept at room temperature (up to 30°C) for up to 4 weeks.' },
        ]
    },
    {
        category: 'Logistics',
        icon: '🚚',
        faqs: [
            { question: 'How is the medication shipped?', answer: 'We use specialized cold-chain logistics partners to ensure your medication stays at the correct temperature from our pharmacy to your doorstep.' },
            { question: 'Do you deliver to my office?', answer: 'Yes, as long as there is someone to receive the package and store it in a refrigerator immediately.' },
        ]
    }
];

export const teamMembers = [
    {
        name: 'Dr. Riya Gupta',
        specialty: 'Endocrinologist',
        imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop',
        bio: 'Dr. Gupta is a leading endocrinologist with over 12 years of experience at top hospitals in Delhi and Mumbai. She specializes in metabolic disorders and medical weight management.'
    },
    {
        name: 'Dr. Arun Kumar',
        specialty: 'Internal Medicine',
        imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop',
        bio: 'Dr. Kumar focuses on the intersection of lifestyle medicine and pharmacotherapy. He is passionate about helping patients reverse metabolic syndrome.'
    },
    {
        name: 'Dr. Meera Reddy',
        specialty: 'Clinical Nutritionist',
        imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1974&auto=format&fit=crop',
        bio: 'Dr. Reddy leads our nutrition protocols, ensuring that your weight loss is supported by a balanced, sustainable Indian diet plan.'
    }
];

export const whyGlp1Benefits = [
    { title: 'Quiets Food Noise', description: 'Stop thinking about food 24/7. GLP-1s work on the brain to reduce cravings and intrusive thoughts about eating.', icon: <BrainIcon /> },
    { title: 'Metabolic Reset', description: 'Corrects underlying insulin resistance, helping your body burn fat for fuel instead of storing it.', icon: <MetabolismIcon /> },
    { title: 'Slower Digestion', description: 'Feel fuller, faster. By slowing gastric emptying, you naturally eat smaller portions without feeling deprived.', icon: <GutIcon /> },
];

// --- Types ---
export type PatientStatus = 'Assessment Review' | 'Labs Ordered' | 'Awaiting Lab Confirmation' | 'Awaiting Lab Results' | 'Ready for Consult' | 'Consultation Scheduled' | 'Follow-up Required' | 'Awaiting Shipment' | 'Ongoing Treatment' | 'Monitoring Loop' | 'Action Required' | 'Additional Testing Required';

export interface Prescription {
    name: string;
    dosage: string;
    instructions: string;
    type?: 'replace' | 'add' | 'adjust' | 'onetime';
}

export interface ShippingAddress {
    line1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface Vital {
    label: string;
    value: string;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    date: string;
}

export interface Exercise {
    name: string;
    sets: string | number;
    reps: string | number;
    note?: string;
}

export interface WorkoutRoutine {
    title: string;
    description: string;
    durationMin: number;
    exercises: Exercise[];
}

export interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'Assessment' | 'Labs' | 'Consultation' | 'Shipment' | 'Protocol' | 'Note';
    doctor?: string;
    documentId?: string;
    context?: any;
}

export interface DailyLog {
    medicationTaken: boolean;
    proteinIntake: number;
    waterIntake: number;
    mindsetCompleted: string[];
    fitnessCompleted: boolean;
}

export interface WeekLogEntry {
    week: number;
    weight: number;
    sideEffects?: string;
    notes?: string;
}

export interface MedicalReport {
    id: string;
    name: string;
    date: string;
    summary: string;
}

export interface Patient {
    id: number;
    name: string;
    age: number;
    dob?: string;
    imageUrl: string;
    email: string;
    phone: string;
    shippingAddress: ShippingAddress;
    goal: string;
    status: PatientStatus;
    nextAction: string;
    pathway?: string;
    vitals: Vital[];
    reports: MedicalReport[];
    timeline: TimelineEvent[];
    currentPrescription: Prescription;
    prescriptionHistory: PrescriptionLog[];
    weeklyLogs: WeekLogEntry[];
    dailyLogs?: Record<string, DailyLog>;
    careTeam: {
        physician: string;
        coordinator: string;
        nutritionist?: string;
        trainer?: string;
    };
    carePlan?: {
        medicationSchedule: {
            dayOfWeek: number;
            timeOfDay: string;
        };
        nutrition: {
            proteinGrams: number;
            waterLitres: number;
        };
        fitness: {
            weeklyGoal: number;
            type: string;
            protocol?: {
                name: string;
                description: string;
                routines: WorkoutRoutine[];
            };
        };
        mindbody: string[];
    };
}

export interface PrescriptionLog {
    id: string;
    date: string;
    medication: string;
    dosage: string;
    notes: string;
    doctor: string;
}

export interface CareCoordinatorTask {
    id: string;
    patientId: number;
    patientName: string;
    patientImageUrl: string;
    type: 'New Message' | 'Follow-up Request' | 'New Consultation' | 'Lab Coordination' | 'Medication Shipment' | 'Intake Review' | 'Prescription Approval' | 'General Support';
    details: string;
    patientStatus: PatientStatus;
    priority: 'High' | 'Medium' | 'Low';
    timestamp: string;
    context?: any;
}

export interface DoctorAppointment {
    id: string;
    patientId: number;
    patientName: string;
    patientImageUrl: string;
    time: string;
    date: string;
    type: 'Consultation' | 'Follow-up' | 'Review';
}

export interface CareCoordinatorAppointment {
    id: string;
    patientId: number;
    patientName: string;
    patientImageUrl: string;
    time: string;
    date: string;
    type: 'Onboarding' | 'Support' | 'Lab Follow-up';
}

export interface Message {
    sender: 'patient' | 'doctor' | 'careCoordinator' | 'bot' | 'system' | 'trainer' | 'nutritionist';
    text: string;
    timestamp: string;
}

export interface MessageThread {
    id: string;
    patientId: number;
    patientName: string;
    patientImageUrl: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
    lead: 'doctor' | 'careCoordinator' | 'bot';
    messages: Message[];
}

// --- Factory for New Patients ---
export const createNewPatient = (name: string, email: string, phone: string): Patient => ({
    id: Date.now(),
    name: name || 'New Patient',
    age: 0, // Placeholder
    imageUrl: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    email: email,
    phone: phone,
    shippingAddress: { line1: '', city: '', state: '', zip: '', country: 'India' },
    goal: 'Weight Loss',
    status: 'Action Required',
    nextAction: 'Complete medical intake assessment',
    vitals: [],
    reports: [],
    timeline: [
        {
            id: `t_${Date.now()}`,
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            title: 'Account Created',
            description: 'Patient registered via Google Auth.',
            type: 'Assessment'
        },
    ],
    currentPrescription: { name: 'Pending Assessment', dosage: '-', instructions: '-' },
    prescriptionHistory: [],
    weeklyLogs: [],
    careTeam: {
        physician: 'Pending Assignment',
        coordinator: 'Alex Ray',
    },
});

// --- Mock Data ---

export const sideMenuItems = [
    { name: 'Dashboard', id: 'dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { name: 'Live Lounge', id: 'live', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { name: 'My Profile', id: 'profile', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { name: 'Reports', id: 'reports', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 2v-6m-8 13h11a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
    { name: 'Payments', id: 'payments', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    { name: 'Care Team', id: 'care_team', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { name: 'Help & FAQ', id: 'help', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

export const dashboardSteps = [
    { id: 'intake', name: 'Intake', icon: '📋' },
    { id: 'labs', name: 'Labs', icon: '🧬' },
    { id: 'consult', name: 'Consult', icon: '🤝' },
    { id: 'shipping', name: 'Shipping', icon: '🚚' },
    { id: 'treatment', name: 'Treatment', icon: '✨' },
];

export const mockPatients: Patient[] = [];

export const mockCareCoordinatorTasks: CareCoordinatorTask[] = [];

export const mockAppointments: DoctorAppointment[] = [];

export const mockCareCoordinatorAppointments: CareCoordinatorAppointment[] = [];

export const mockMessageThreads: MessageThread[] = [];

export const mockCareCoordinatorMessageThreads: MessageThread[] = [];
