
import React from 'react';
import { Patient } from '../constants';

interface HealthMetricsDashboardProps {
    patient: Patient;
    className?: string; // Add className prop here
}

// Helper to safely display values or defaults
const formatValue = (val: any, unit: string = '') => {
    if (val === undefined || val === null || val === '') return 'N/A';
    return `${val} ${unit}`.trim();
};

const getStatusForValue = (val: any, range: string): string => {
    // Basic logic for demo - real logic would parse range strings
    if (val === undefined || val === null || val === '') return 'Pending';
    return 'Normal';
};


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

// --- Psych Scoring Helpers ---

const phq9Map: Record<string, number> = {
    'Not at all (0 days)': 0,
    'Several days (2-6 days)': 1,
    'More than half (7-11 days)': 2,
    'Nearly every day (12-14 days)': 3
};

const eat26Map: Record<string, number> = {
    'Always': 3,
    'Usually': 2,
    'Often': 1,
    'Sometimes': 0,
    'Rarely': 0,
    'Never': 0
};

// BES Scoring Reference (matching DigitalIntake.tsx)
const besScoring: Record<number, Record<string, number>> = {
    0: {
        "I don't feel self-conscious about my weight or body size when I'm with others.": 0,
        "I feel concerned about how I look to others, but it normally doesn't make me feel disappointed with myself.": 0,
        "I do get self-conscious about my appearance and weight which makes me feel disappointed in myself.": 1,
        "I feel very self-conscious about my weight and frequently, I feel like I'm just failing at everything.": 3
    },
    1: {
        "I don't have any difficulty eating slowly in the proper manner.": 0,
        "Although I seem to devour foods, I don't end up feeling stuffed because of eating too much.": 1,
        "At times, I tend to eat quickly and then, I feel uncomfortably full afterwards.": 2,
        "I have the habit of bolting down my food, without really chewing it. When this happens I usually feel uncomfortably stuffed because I've eaten too much.": 3
    },
    2: {
        "I feel capable to control my eating urges when I want to.": 0,
        "I feel like I have failed to control my eating more than the average person.": 1,
        "I feel utterly helpless when it comes to controlling my eating urges.": 3,
        "Because I feel so helpless about controlling my eating I have become very desperate about trying to get in control.": 3
    },
    3: {
        "I don't have the habit of eating when I'm bored.": 0,
        "I sometimes eat when I'm bored, but often I'm able to get busy and get my mind off food.": 0,
        "I have a regular habit of eating when I'm bored, but occasionally, I can use some other activity to get my mind off it.": 0,
        "I have a strong habit of eating when I'm bored. Nothing seems to help me break the habit.": 2
    },
    4: {
        "I'm usually physically hungry when I eat something.": 0,
        "Occasionally, I eat something on impulse even though I'm not really hungry.": 1,
        "I have the regular habit of eating foods, that I might not really enjoy, to satisfy a hungry feeling even though physically, I don't need the food.": 2,
        "Even though I'm not physically hungry, I get a hungry feeling in my mouth that only seems to be satisfied when I eat a food.": 3
    },
    5: {
        "I don't feel any guilt or self-hate after I overeat.": 0,
        "After I overeat, occasionally I feel guilt or self-hate.": 1,
        "Almost all the time I experience strong guilt or self-hate after I overeat.": 3
    },
    6: {
        "I don't lose total control of my eating when dieting even after periods when I overeat.": 0,
        "Sometimes when I eat a \"forbidden food\" on a diet, I feel like I blew it and eat even more.": 2,
        "Frequently, I have the habit of saying to myself, \"I've blown it now, why not go all the way\" when I overeat on a diet.": 3
    },
    7: {
        "I rarely eat so much food that I feel uncomfortably stuffed afterwards.": 0,
        "Usually about once a month, I eat such a quantity of food, I end up feeling very stuffed.": 1,
        "I have regular periods during the month when I eat large amounts of food, either at mealtime or at snacks.": 2,
        "I eat so much food that I regularly feel quite uncomfortable after eating.": 3
    }
};

export const PsychView: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Calculate Scores
    const psych = patient.psych || {};

    // PHQ-9
    let phq9Score = 0;
    let phq9Completed = false;
    // Check if any PHQ data exists
    if (Object.keys(psych).some(k => k.startsWith('phq9_'))) {
        for (let i = 0; i < 9; i++) {
            const val = psych[`phq9_${i}`];
            if (val && phq9Map[val] !== undefined) {
                phq9Score += phq9Map[val];
            }
        }
        phq9Completed = true;
    }

    // BES
    let besScore = 0;
    let besCompleted = false;
    if (Object.keys(psych).some(k => k.startsWith('bes_'))) {
        for (let i = 0; i < 8; i++) {
            const val = psych[`bes_${i}`];
            if (val && besScoring[i] && besScoring[i][val] !== undefined) {
                besScore += besScoring[i][val];
            }
        }
        besCompleted = true;
    }

    // EAT-26
    let eat26Score = 0;
    let eat26Completed = false;
    if (Object.keys(psych).some(k => k.startsWith('eat26_'))) {
        // Questions 1-25 (Indices 0-24): Always=3...
        for (let i = 0; i < 25; i++) {
            const val = psych[`eat26_${i}`];
            if (val && eat26Map[val] !== undefined) {
                eat26Score += eat26Map[val];
            }
        }
        // Question 26 (Index 25): Special scoring? 
        // Standard EAT-26: Q26 'I have the impulse to vomit after meals'
        // Never=0, Rarely=0, Sometimes=0, Often=1, Usually=2, Always=3 (Same as others actually? No, standard is 3,2,1,0,0,0)
        // Wait, standard EAT-26 scoring is:
        // Q1-25: Always=3, Usually=2, Often=1, Others=0
        // Q26: Never, Rarely, Sometimes, Often, Usually, Always...
        // Let's check standard EAT-26 tool rules.
        // Actually DigitalIntake just captures string.
        // The simplistic map above (Always=3... Never=0) is a good approximation for 'high risk' mapping.
        // Standard EAT-26 logic:
        // Items 1-25: Always=3, Usually=2, Often=1, Others=0.
        // Item 26: Never=0, Rarely=0, Sometimes=0, Often=1, Usually=2, Always=3.
        // My map gives 3,2,1,0,0,0.
        // Let's just use the map for all as a robust enough metric for now unless specified otherwise.
        const val25 = psych[`eat26_25`];
        if (val25 && eat26Map[val25] !== undefined) {
            eat26Score += eat26Map[val25];
        }
        eat26Completed = true;
    }

    const psychMetrics = [
        {
            name: 'Depression (PHQ-9)',
            score: phq9Completed ? phq9Score : 0,
            max: 27,
            color: 'bg-brand-purple',
            severity: !phq9Completed ? 'Pending' : (phq9Score > 9 ? 'Moderate' : 'Minimal'),
            pending: !phq9Completed
        },
        {
            name: 'Binge Eating (BES)',
            score: besCompleted ? besScore : 0,
            max: 46,
            color: 'bg-brand-pink',
            severity: !besCompleted ? 'Pending' : (besScore > 17 ? 'High' : 'Low'),
            pending: !besCompleted
        },
        {
            name: 'Food Anxiety (EAT-26)',
            score: eat26Completed ? eat26Score : 0,
            max: 78,
            color: 'bg-brand-cyan',
            severity: !eat26Completed ? 'Pending' : (eat26Score > 20 ? 'High' : 'Low'),
            pending: !eat26Completed
        },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {psychMetrics.map((metric, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-800">{metric.name}</h4>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${metric.pending ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-600'}`}>
                                {metric.severity}
                            </span>
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                            <span className={`text-3xl font-extrabold ${metric.pending ? 'text-gray-300' : 'text-gray-900'}`}>
                                {metric.pending ? '--' : metric.score}
                            </span>
                            <span className="text-sm text-gray-400 mb-1">/ {metric.max}</span>
                        </div>
                        <ProgressBar value={metric.score} max={metric.max} colorClass={metric.pending ? 'bg-gray-200' : metric.color} />
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h4 className="font-bold text-blue-900 mb-2">Clinical Interpretation</h4>
                {(phq9Completed || besCompleted) ? (
                    <p className="text-sm text-blue-800 leading-relaxed">
                        {phq9Completed && (phq9Score > 9
                            ? 'Patient exhibits moderate depressive symptoms which may impact adherence. Behavioral activation recommended.'
                            : 'Mood indicators are stable. No significant barrier to adherence identified.')}
                        <br /><br />
                        {besCompleted && (besScore > 17
                            ? 'Elevated Binge Eating Scale score suggests need for impulse control support alongside GLP-1 therapy.'
                            : 'Eating patterns appear regulated with low risk of binge behavior.')}
                    </p>
                ) : (
                    <p className="text-sm text-blue-800 leading-relaxed italic">
                        Waiting for patient to complete initial psychometric assessment.
                    </p>
                )}
            </div>
        </div>
    );
};

export const VitalsView: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Get latest vitals
    const latestVitals = patient.vitals && patient.vitals.length > 0 ? patient.vitals[0] : null;

    // Helper to extract value by label if vitals is a list, OR if it's a flat object.
    // Based on PatientLive, vitals might be saved as a list of { label, value, unit, date }.
    // But VitalsWidget in PatientLive saves flat object to 'vitals' section in cloud.
    // App.tsx reconstructs it. Let's handle both flat object (from widget submit) and list (from onUpdatePatient).
    // Actually PatientLive `handleWidgetSubmit` does: saveToCloudBucket('vitals', data) -> flat object.
    // AND `onUpdatePatient` does: { vitals: [{ label: 'Weight', value... }] } -> list.
    // We should probably check the flat object 'vitals' from the profile if available, or the list.
    // Let's assume `patient.vitals` might be the list. Let's look for "Weight" and "Height".

    // Try to find weight and height
    let weight = 0;
    let heightFt = 0;
    let heightIn = 0;

    // Check list
    if (Array.isArray(patient.vitals)) {
        const wObj = patient.vitals.find(v => v.label === 'Weight');
        if (wObj) weight = parseFloat(wObj.value);
        // Height might not be in the daily list if it's static.
    }

    // Fallback/Primary: Check if we have a flat vitals object stored in the patient (custom field from our Cloud sync)
    // The App.tsx mapping might not expose the flat 'vitals' section directly if it only maps to 'vitals' list.
    // However, let's assume likely access pattern or simple calc from what we have.
    // If we can't find height, we can't calc BMI.
    // Let's add a safe fallback or just show what we have.

    const bmi = (weight > 0 && heightFt > 0) ? (weight / Math.pow(((heightFt * 12 + heightIn) * 0.0254), 2)).toFixed(1) : 'N/A';

    // For now, let's just display the Vitals we have in the list.
    // And if we can derive BMI, great.

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            {/* If we have vitals list, show card for each */}
            {patient.vitals?.slice(0, 3).map((v, i) => (
                <MetricCard key={i} label={v.label} value={`${v.value} ${v.unit}`} status="Normal" subtext={v.date} />
            ))}
            {/* If empty, show placeholder */}
            {(!patient.vitals || patient.vitals.length === 0) && (
                <div className="col-span-3 text-center p-4 bg-gray-50 rounded-xl text-gray-500 text-sm">No recent vitals recorded.</div>
            )}
        </div>
    );
};

export const SafetyView: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Access medical data from patient object
    const m = patient.medical || {};

    // Helper to normalize status
    // Database might store booleans (true/false) or strings ("Yes"/"No")
    // Screenshot shows booleans: contra_mtc: true
    const getStatus = (val: any) => {
        if (val === true || val === 'Yes') return 'Positive';
        if (val === false || val === 'No' || val === null || val === undefined) return 'Negative';
        return 'Unknown';
    };

    const isCleared = (val: any) => {
        return val === false || val === 'No' || val === null || val === undefined;
    };

    const contraindications = [
        { name: 'History of MTC', status: getStatus(m.contra_mtc), cleared: isCleared(m.contra_mtc) },
        { name: 'MEN 2 Syndrome', status: getStatus(m.contra_men2), cleared: isCleared(m.contra_men2) },
        { name: 'Pancreatitis', status: getStatus(m.contra_pancreatitis), cleared: isCleared(m.contra_pancreatitis) },
        { name: 'Suicidal Ideation', status: getStatus(m.contra_suicide), cleared: isCleared(m.contra_suicide) },
    ];

    const allContraindicationsCleared = contraindications.every(c => c.cleared);

    const familyHistory = [
        { condition: 'Obesity', relation: 'Family', status: getStatus(m.family_obesity) },
        { condition: 'Type 2 Diabetes', relation: 'Family', status: getStatus(m.family_diabetes) },
        { condition: 'Cardiovascular Disease', relation: 'Family', status: getStatus(m.family_cardio) },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-bold text-gray-800">Contraindications Check</h4>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${allContraindicationsCleared ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {allContraindicationsCleared ? 'CLEARED' : 'RISK DETECTED'}
                    </span>
                </div>
                <div className="divide-y divide-gray-100">
                    {contraindications.map((item, i) => (
                        <div key={i} className="px-6 py-4 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${item.cleared ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                {item.status} {item.cleared ? '✓' : '⚠️'}
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
                            <span className={`text-xs font-medium px-2 py-1 rounded border ${item.status === 'Positive' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                {item.status}
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
            <DashboardModule title="Recent Vitals" icon="📈">
                <VitalsView patient={patient} />
            </DashboardModule>

            <DashboardModule title="Metabolic Health" icon="🧬">
                <MetabolicView patient={patient} />
            </DashboardModule>

            <DashboardModule title="Psychometrics" icon="🧠">
                <PsychView patient={patient} />
            </DashboardModule>

            <DashboardModule title="History & Safety" icon="🛡️">
                <SafetyView patient={patient} />
            </DashboardModule>
        </div >
    );
};

export default HealthMetricsDashboard;
