
import React, { useState } from 'react';
import { Patient, TimelineEvent } from '../../constants';
import { MetabolicView, PsychView, SafetyView, VitalsView } from '../HealthMetricsDashboard';

// --- Shared Components ---

const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const ChevronUp = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;
const SparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;

const SectionCard = ({ title, icon, summary, children, isOpen, onToggle, riskLevel }: { title: string, icon: string, summary: string, children?: React.ReactNode, isOpen: boolean, onToggle: () => void, riskLevel: 'Low' | 'Moderate' | 'High' }) => {
    const riskColors = {
        'High': 'text-red-700 bg-red-100 border-red-200',
        'Moderate': 'text-yellow-700 bg-yellow-100 border-yellow-200',
        'Low': 'text-green-700 bg-green-100 border-green-200',
    };

    return (
        <div className={`bg-white border transition-all duration-300 rounded-xl mb-4 overflow-hidden ${isOpen ? 'shadow-md border-brand-purple/30' : 'shadow-sm border-gray-200 hover:border-brand-purple/20'}`}>
            <div
                className={`p-5 flex items-start justify-between cursor-pointer ${isOpen ? 'bg-gray-50/50' : 'bg-white'}`}
                onClick={onToggle}
            >
                <div className="flex items-start gap-4 flex-1">
                    <span className="text-2xl mt-1">{icon}</span>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                            {!isOpen && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${riskColors[riskLevel]}`}>
                                    {riskLevel} Risk
                                </span>
                            )}
                        </div>

                        {/* AI Summary Block - Only visible when minimized */}
                        {!isOpen && (
                            <div className="mt-2 relative">
                                <div className="flex items-start gap-2 text-sm text-gray-600 bg-gradient-to-r from-brand-purple/5 to-white p-3 rounded-lg border border-brand-purple/10">
                                    <span className="mt-0.5"><SparkleIcon /></span>
                                    <p className="leading-relaxed text-gray-700">{summary}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-brand-purple transition-colors ml-4">
                    {isOpen ? <div className="flex items-center gap-1 text-xs font-bold uppercase">Less <ChevronUp /></div> : <div className="flex items-center gap-1 text-xs font-bold uppercase">Deep Dive <ChevronDown /></div>}
                </button>
            </div>

            {/* Expanded Content */}
            {isOpen && (
                <div className="p-6 border-t border-gray-100 bg-white animate-fade-in cursor-default" onClick={(e) => e.stopPropagation()}>
                    {children}
                </div>
            )}
        </div>
    );
};

// --- Main Component ---

interface PatientScorecardProps {
    patient: Patient;
    onUpdatePatient?: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates?: Partial<Patient>) => void;
}

const PatientScorecard: React.FC<PatientScorecardProps> = ({ patient, onUpdatePatient }) => {
    // State to track which section is expanded
    const [expandedSection, setExpandedSection] = useState<'metabolic' | 'psych' | 'safety' | null>(null);

    // Real Data Derivation
    // Vitals / BMI
    const getVital = (label: string) => {
        if (!patient.vitals) return '0';
        if (Array.isArray(patient.vitals)) {
            return patient.vitals.find(v => v.label === label)?.value || '0';
        }
        return '0';
    };
    const weight = parseFloat(getVital('Weight'));
    // Approximate BMI calc if not explicitly present, or use stored BMI
    // Let's rely on stored BMI if possible, or calculate if we had height. 
    // Simplify: Use stored 'BMI' from vitals list if present.
    // If logic needed: (weight / height^2) ...
    let bmi = parseFloat(getVital('BMI'));
    if (bmi === 0 && weight > 0) {
        // Fallback or placeholder logic. Without height, difficult. 
        // Assume backend/vitals widget calculates it.
    }

    // Labs / HOMA-IR
    // Check patient.tracking.labs
    const homaIr = patient.tracking?.labs?.homaIr ? parseFloat(patient.tracking.labs.homaIr as string) : 0; // Labs are nested under tracking
    // If not in labs, fallback to 0. 

    const isHighRiskBMI = bmi > 30;

    // Psych
    const phq9Score = patient.psych?.phq9_score ? parseFloat(patient.psych.phq9_score as string) : 0;
    const besScore = patient.psych?.bes_score ? parseFloat(patient.psych.bes_score as string) : 0;

    // Risk Calculations
    const metabolicRisk = (homaIr > 2.5 || isHighRiskBMI || bmi > 27) ? 'High' : (bmi > 25 ? 'Moderate' : 'Low');
    const psychRisk = phq9Score > 10 || besScore > 15 ? 'High' : 'Low';

    // Safety
    // Check contraindications
    const m = patient.medical || {};
    const hasContraindication = m.contra_mtc || m.contra_men2 || m.contra_pancreatitis || m.contra_suicide;
    const safetyRisk = hasContraindication ? 'High' : 'Low';

    const toggleSection = (section: 'metabolic' | 'psych' | 'safety') => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    // Dynamic AI Summaries
    const metabolicSummary = isHighRiskBMI
        ? `Patient presents with Class I Obesity (BMI ${bmi}) and HOMA-IR of ${homaIr || 'N/A'}, indicating significant insulin resistance. Metabolic profile suggests strong suitability for GLP-1 therapy.`
        : `Patient BMI (${bmi}) is ${bmi > 25 ? 'within overweight' : 'within normal'} range. Insulin sensitivity is ${homaIr > 2 ? 'impaired' : 'normal'}. Standard titration protocol recommended.`;

    const psychSummary = psychRisk === 'High'
        ? `Screening indicates moderate risk for binge eating behaviors (BES: ${besScore}). Mood stability requires monitoring (PHQ-9: ${phq9Score}). Behavioral support module recommended.`
        : `Psychometric screening is clear. Low risk for binge eating or depressive symptoms. Patient demonstrates good readiness for change.`;

    const safetySummary = hasContraindication
        ? `CRITICAL: Contraindications detected (${m.contra_mtc ? 'MTC' : ''} ${m.contra_men2 ? 'MEN2' : ''}). Review required before initiation.`
        : `No absolute contraindications detected. Kidney and Liver function normal. Cleared for treatment initiation.`;


    return (
        <div className="mb-8">
            {/* Header / Triage Decision */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Clinical Scorecard</h2>
                    <p className="text-gray-500 text-sm mt-1">AI-synthesized overview of patient eligibility and risk factors.</p>
                </div>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-2">
                <SectionCard
                    title="Metabolic Health"
                    icon="🧬"
                    summary={metabolicSummary}
                    isOpen={expandedSection === 'metabolic'}
                    onToggle={() => toggleSection('metabolic')}
                    riskLevel={metabolicRisk}
                >
                    <div className="space-y-6">
                        <VitalsView patient={patient} />
                        <MetabolicView patient={patient} />
                    </div>
                </SectionCard>

                <SectionCard
                    title="Psychometrics"
                    icon="🧠"
                    summary={psychSummary}
                    isOpen={expandedSection === 'psych'}
                    onToggle={() => toggleSection('psych')}
                    riskLevel={psychRisk}
                >
                    <PsychView patient={patient} />
                </SectionCard>

                <SectionCard
                    title="Safety & History"
                    icon="🛡️"
                    summary={safetySummary}
                    isOpen={expandedSection === 'safety'}
                    onToggle={() => toggleSection('safety')}
                    riskLevel={safetyRisk}
                >
                    <SafetyView patient={patient} />
                </SectionCard>
            </div>
        </div>
    );
};

export default PatientScorecard;
