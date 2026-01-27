
import React from 'react';
import { Patient } from '../constants';

interface HealthMetricsDashboardProps {
    patient: Patient;
    className?: string;
}

// --- Visual Sub-Components ---

const ProgressBar: React.FC<{ value: number; max: number; colorClass: string }> = ({ value, max, colorClass }) => (
    <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
        <div className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }}></div>
    </div>
);

const MetricCard: React.FC<{ label: string; value: string; status: string; subtext?: string }> = ({ label, value, status, subtext }) => {
    const getStatusColor = (s: string) => {
        if (s === 'High' || s === 'Positive') return 'bg-red-100 text-red-700 border-red-200';
        if (s === 'Low' && label !== 'Thyroid Function (TSH)') return 'bg-green-100 text-green-700 border-green-200'; // Context dependent
        if (s === 'Normal' || s === 'Negative') return 'bg-green-100 text-green-700 border-green-200';
        if (s === 'Moderate') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(status)}`}>{status}</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
            </div>
            {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
        </div>
    );
};

// --- Module Wrapper ---
const DashboardModule: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8 transition-all hover:shadow-md">
        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

// --- Tab Views (Now used as Section Components) ---

export const MetabolicView: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Mock data based on patient ID logic
    const isRisk = patient.id === 2;
    
    const labs = [
        { category: 'Glycemic Control', name: 'HbA1c', value: isRisk ? '6.1%' : '5.7%', range: '< 5.7%', status: isRisk ? 'High' : 'Normal' },
        { category: 'Glycemic Control', name: 'Fasting Insulin', value: isRisk ? '22 uIU/mL' : '18 uIU/mL', range: '< 25 uIU/mL', status: 'Normal' },
        { category: 'Lipid Panel', name: 'LDL Cholesterol', value: isRisk ? '160 mg/dL' : '110 mg/dL', range: '< 100 mg/dL', status: isRisk ? 'High' : 'Moderate' },
        { category: 'Lipid Panel', name: 'ApoB', value: isRisk ? '115 mg/dL' : '85 mg/dL', range: '< 90 mg/dL', status: isRisk ? 'High' : 'Normal' },
        { category: 'Lipid Panel', name: 'Lp(a)', value: isRisk ? '45 mg/dL' : '15 mg/dL', range: '< 30 mg/dL', status: isRisk ? 'High' : 'Normal' },
        { category: 'Inflammation', name: 'hsCRP', value: isRisk ? '3.5 mg/L' : '0.8 mg/L', range: '< 2.0 mg/L', status: isRisk ? 'High' : 'Normal' },
        { category: 'Organ Function', name: 'TSH (Thyroid)', value: '2.4 mIU/L', range: '0.4 - 4.0 mIU/L', status: 'Normal' },
        { category: 'Organ Function', name: 'ALT (Liver)', value: '28 U/L', range: '7-55 U/L', status: 'Normal' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {labs.slice(0, 4).map((lab, i) => (
                    <MetricCard key={i} label={lab.name} value={lab.value} status={lab.status} subtext={`Ref: ${lab.range}`} />
                ))}
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800">Comprehensive Panel Results</h4>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3 font-medium">Marker</th>
                            <th className="px-6 py-3 font-medium">Result</th>
                            <th className="px-6 py-3 font-medium hidden sm:table-cell">Reference</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {labs.map((lab, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-gray-900 block">{lab.name}</span>
                                    <span className="text-xs text-gray-400">{lab.category}</span>
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-700">{lab.value}</td>
                                <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">{lab.range}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lab.status === 'Normal' ? 'bg-green-100 text-green-800' : lab.status === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {lab.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const PsychView: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Mock psych scores
    const phq9Score = patient.id === 1 ? 4 : 12; 
    const besScore = patient.id === 1 ? 8 : 18;

    const psychMetrics = [
        { name: 'Depression (PHQ-9)', score: phq9Score, max: 27, color: 'bg-brand-purple', severity: phq9Score > 9 ? 'Moderate' : 'Minimal' },
        { name: 'Binge Eating (BES)', score: besScore, max: 46, color: 'bg-brand-pink', severity: besScore > 17 ? 'High' : 'Low' },
        { name: 'Food Anxiety (EAT-26)', score: 10, max: 78, color: 'bg-brand-cyan', severity: 'Low' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {psychMetrics.map((metric, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-800">{metric.name}</h4>
                            <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">{metric.severity}</span>
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-extrabold text-gray-900">{metric.score}</span>
                            <span className="text-sm text-gray-400 mb-1">/ {metric.max}</span>
                        </div>
                        <ProgressBar value={metric.score} max={metric.max} colorClass={metric.color} />
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h4 className="font-bold text-blue-900 mb-2">Clinical Interpretation</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                    {phq9Score > 9 
                        ? 'Patient exhibits moderate depressive symptoms which may impact adherence. Behavioral activation recommended.'
                        : 'Mood indicators are stable. No significant barrier to adherence identified.'}
                    <br/><br/>
                    {besScore > 17
                        ? 'Elevated Binge Eating Scale score suggests need for impulse control support alongside GLP-1 therapy.'
                        : 'Eating patterns appear regulated with low risk of binge behavior.'}
                </p>
            </div>
        </div>
    );
};

export const SafetyView: React.FC<{ patient: Patient }> = ({ patient }) => {
    const contraindications = [
        { name: 'History of MTC', status: 'Negative' },
        { name: 'MEN 2 Syndrome', status: 'Negative' },
        { name: 'Pancreatitis', status: 'Negative' },
        { name: 'Suicidal Ideation', status: 'Negative' },
    ];

    const familyHistory = [
        { condition: 'Obesity', relation: 'Mother', status: 'Positive' },
        { condition: 'Type 2 Diabetes', relation: 'Father', status: 'Positive' },
        { condition: 'Cardiovascular Disease', relation: 'Paternal Grandfather', status: 'Positive' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-bold text-gray-800">Contraindications Check</h4>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">CLEARED</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {contraindications.map((item, i) => (
                        <div key={i} className="px-6 py-4 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                {item.status} ✓
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h4 className="font-bold text-gray-800">Family History Matrix</h4>
                </div>
                <div className="divide-y divide-gray-100">
                    {familyHistory.map((item, i) => (
                        <div key={i} className="px-6 py-4 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{item.condition}</span>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                {item.relation}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---

const HealthMetricsDashboard: React.FC<HealthMetricsDashboardProps> = ({ patient, className = "" }) => {
    return (
        <div className={`flex flex-col ${className}`}>
            <DashboardModule title="Metabolic Health" icon="🧬">
                <MetabolicView patient={patient} />
            </DashboardModule>

            <DashboardModule title="Psychometrics" icon="🧠">
                <PsychView patient={patient} />
            </DashboardModule>

            <DashboardModule title="History & Safety" icon="🛡️">
                <SafetyView patient={patient} />
            </DashboardModule>
        </div>
    );
};

export default HealthMetricsDashboard;
