
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
    // 1. Get Real Lab Data from Tracking Collection
    const labData = patient.tracking?.labs || {};

    // Helper to extract specific lab result or default
    const getLab = (key: string, label: string, category: string, range: string) => {
        const val = labData[key];
        // Simple logic: if val exists, status based on key (demo logic for status, real logic for value)
        let status = 'Pending';
        if (val) status = 'Normal'; // Logic to determine High/Low would go here based on range

        return {
            category,
            name: label,
            value: val ? `${val}` : '-',
            range,
            status: val ? status : 'Pending'
        };
    };

    const labs = [
        getLab('hba1c', 'HbA1c', 'Glycemic Control', '< 5.7%'),
        getLab('fasting_insulin', 'Fasting Insulin', 'Glycemic Control', '< 25 uIU/mL'),
        getLab('ldl', 'LDL Cholesterol', 'Lipid Panel', '< 100 mg/dL'),
        getLab('apob', 'ApoB', 'Lipid Panel', '< 90 mg/dL'),
        getLab('lpa', 'Lp(a)', 'Lipid Panel', '< 30 mg/dL'),
        getLab('hscrp', 'hsCRP', 'Inflammation', '< 2.0 mg/L'),
        getLab('tsh', 'TSH (Thyroid)', 'Organ Function', '0.4 - 4.0 mIU/L'),
        getLab('alt', 'ALT (Liver)', 'Organ Function', '7-55 U/L'),
    ];

    // Filter out only available labs for top cards to avoid "Pending" clutter? 
    // Or show top 4 priority ones regardless.

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
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lab.status === 'Normal' ? 'bg-green-100 text-green-800' : lab.status === 'Pending' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-800'}`}>
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

// PHQ-9 Scoring Map
const phq9Map: { [key: string]: number } = {
    "Not at all": 0,
    "Several days": 1,
    "More than half the days": 2,
    "Nearly every day": 3,
};

// BES Scoring Reference (Full text matching DB values)
const besScoring: { [key: number]: { [key: string]: number } } = {
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

// EAT-26 Scoring Map (common scoring for 0-3 scale)
const eat26Map: { [key: string]: number } = {
    "Never": 0,
    "Rarely": 1,
    "Sometimes": 2,
    "Often": 3,
    "Always": 3, // Often and Always typically score the same for EAT-26
};


export const PsychView: React.FC<{ patient: Patient }> = ({ patient }) => {
    // 2. Get Real Psych Data from Data Collection (psych map)
    const psych = patient.psych || {};

    // --- Dynamic Scoring Logic ---

    // Calculate PHQ-9 (9 Questions)
    let phq9 = 0;
    for (let i = 0; i < 9; i++) {
        const ans = psych[`phq9_${i}`];
        if (ans && phq9Map[ans] !== undefined) {
            phq9 += phq9Map[ans];
        }
    }

    // Calculate BES (Using the 8 questions defined in besScoring 0-7)
    let bes = 0;
    for (let i = 0; i < 8; i++) {
        const ans = psych[`bes_${i}`];
        // besScoring is a nested map: besScoring[questionIndex][answerString]
        if (ans && besScoring[i] && besScoring[i][ans] !== undefined) {
            bes += besScoring[i][ans];
        } else if (ans) {
            console.warn(`Mismatch for BES Q${i}: ${ans}`);
        }
    }

    // Calculate EAT-26 (26 Questions)
    let eat26 = 0;
    for (let i = 0; i < 26; i++) {
        const ans = psych[`eat26_${i}`];
        if (ans && eat26Map[ans] !== undefined) {
            eat26 += eat26Map[ans];
        }
    }

    // Fallback: If scores are explicitly saved as Summary Scores 'phq9_score', use those if calculated is 0 (migration support)
    if (phq9 === 0 && psych.phq9_score) phq9 = parseInt(psych.phq9_score);
    if (bes === 0 && psych.bes_score) bes = parseInt(psych.bes_score);
    if (eat26 === 0 && psych.eat26_score) eat26 = parseInt(psych.eat26_score);


    const getSeverity = (score: number, thresholds: number[]) => {
        if (score < thresholds[0]) return 'LOW';
        if (score < thresholds[1]) return 'MODERATE';
        return 'HIGH';
    };

    const psychMetrics = [
        {
            name: 'Depression Screener (PHQ-9)',
            score: phq9,
            max: 27,
            color: 'bg-brand-purple',
            severity: getSeverity(phq9, [5, 10]),
            colorClass: getSeverity(phq9, [5, 10]) === 'LOW' ? 'bg-green-500' : 'bg-orange-500',
            badgeClass: getSeverity(phq9, [5, 10]) === 'LOW' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        },
        {
            name: 'Binge Eating (BES)',
            score: bes,
            max: 24, // Max for full BES is 46. For 8 questions? Max is ~24. Let's assume full scaling or keep as is.
            color: 'bg-brand-pink',
            severity: getSeverity(bes, [17, 27]),
            colorClass: getSeverity(bes, [17, 27]) === 'LOW' ? 'bg-green-500' : 'bg-red-500',
            badgeClass: getSeverity(bes, [17, 27]) === 'LOW' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        },
        {
            name: 'Eating Patterns (EAT-26)',
            score: eat26,
            max: 27, // 26 * 3
            color: 'bg-brand-cyan',
            severity: getSeverity(eat26, [20, 30]), // EAT-26 cutoff is typically 20 for "referral"
            colorClass: getSeverity(eat26, [20, 30]) === 'LOW' ? 'bg-teal-400' : 'bg-red-500',
            badgeClass: getSeverity(eat26, [20, 30]) === 'LOW' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {psychMetrics.map((metric, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-800 text-sm">{metric.name}</h4>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${metric.badgeClass}`}>
                                {metric.severity}
                            </span>
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-extrabold text-gray-900">
                                {metric.score}
                            </span>
                            <span className="text-sm text-gray-400 mb-1">/ {metric.max}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
                            <div className={`h-2.5 rounded-full ${metric.colorClass}`} style={{ width: `${Math.min((metric.score / metric.max) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-blue-900 mb-2">Clinical Interpretation</h4>
                    <div className="text-sm text-blue-800 leading-relaxed space-y-4">
                        <p>{phq9 < 5 ? "Mood stability normal." : "Mood monitoring recommended."}</p>
                        <p>{bes < 17 ? "Low risk for Binge Eating Disorder." : bes < 27 ? "Moderate risk for Binge Eating." : "High risk for Binge Eating behaviors."}</p>
                        <p>{eat26 < 20 ? "Eating patterns within normal range." : "Screening suggests potential disordered eating patterns."}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const VitalsView: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Keep VitalsView as is, but ensure it handles empty states gracefully
    // ... [Already implemented correctly in previous logic step, just re-affirming]

    // Check list
    let weight = 0;

    if (Array.isArray(patient.vitals)) {
        const wObj = patient.vitals.find(v => v.label === 'Weight');
        if (wObj) weight = parseFloat(wObj.value);
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            {/* If we have vitals list, show card for each */}
            {patient.vitals?.slice(0, 3).map((v, i) => (
                <MetricCard key={i} label={v.label} value={`${v.value} ${v.unit || ''}`} status="Normal" subtext={v.date} />
            ))}
            {/* If empty, show placeholder */}
            {(!patient.vitals || patient.vitals.length === 0) && (
                <div className="col-span-3 text-center p-4 bg-gray-50 rounded-xl text-gray-500 text-sm">No recent vitals recorded.</div>
            )}
        </div>
    );
};

export const SafetyView: React.FC<{ patient: Patient }> = ({ patient }) => {
    // 3. Get Real Medical Data
    const medical = patient.medical || {};

    // Helper to get status or default
    const getStatus = (key: string, defaultStatus: string = 'Pending') => {
        if (medical[key] === undefined || medical[key] === null || medical[key] === '') return defaultStatus;
        // If it's a boolean true, return a display string? Or if it's the string value itself?
        // Assuming the DB stores strings like "Yes", "No", or boolean.
        // If boolean true -> "Yes" or "Active" (depending on context), If false -> "No"
        if (medical[key] === true) return 'Yes';
        if (medical[key] === false) return 'No';
        return medical[key];
    };

    // Active Conditions List
    const activeConditionsList = [
        { key: 't2d', label: 'Type 2 Diabetes', default: 'Pending' },
        { key: 'hypertension', label: 'Hypertension (Medicated)', default: 'Pending' },
        { key: 'cholesterol', label: 'High Cholesterol', default: 'Pending' },
        { key: 'fatty_liver', label: 'Fatty Liver (NAFLD)', default: 'Pending' },
        { key: 'thyroid_issues', label: 'Thyroid Issues', default: 'Pending' },
        { key: 'sleep_apnea', label: 'Sleep Apnea (CPAP)', default: 'Pending' },
        { key: 'pcos', label: 'PCOS', default: 'Pending' }
    ];

    // Family History List
    const familyHistoryList = [
        { key: 'family_obesity', label: 'Obesity', sub: 'Immediate Family', default: 'No' },
        { key: 'family_diabetes', label: 'Type 2 Diabetes', sub: 'Parent/Sibling', default: 'No' },
        { key: 'family_cardio', label: 'Early Heart Attack', sub: 'Before age 50', default: 'No' },
        { key: 'family_thyroid', label: 'Thyroid Cancer', sub: 'Any Family Member', default: 'No' },
    ];

    // Contraindications List
    const contraindicationsList = [
        { key: 'contra_mtc', label: 'History of MTC', default: 'Clear' },
        { key: 'contra_men2', label: 'MEN 2 Syndrome', default: 'Clear' },
        { key: 'contra_pancreatitis', label: 'Pancreatitis History', default: 'Clear' },
        { key: 'contra_suicide', label: 'Suicidal Ideation', default: 'Clear' },
        { key: 'contra_pregnancy', label: 'Pregnancy / Nursing', default: 'Clear' },
    ];

    const getStatusColor = (status: string, type: 'condition' | 'family' | 'contra') => {
        const s = status.toLowerCase();
        if (s === 'pending') return 'text-orange-500 bg-orange-50';
        if (s === 'yes' || s === 'active' || s === 'detected') return 'text-red-600 bg-red-100'; // Bad checks
        if (s === 'no' || s === 'clear') return 'text-green-600 bg-green-50'; // Good checks
        return 'text-gray-500';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Column 1: Active Conditions (Blue) */}
            <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100">
                    <h4 className="font-bold text-blue-800 uppercase text-xs tracking-wider">Active Conditions</h4>
                </div>
                <div className="divide-y divide-gray-100">
                    {activeConditionsList.map((item, i) => {
                        const status = getStatus(item.key, item.default);
                        return (
                            <div key={i} className="px-6 py-4 flex justify-between items-center group hover:bg-gray-50 transition-colors">
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${getStatusColor(status, 'condition')}`}>
                                    {status === true ? 'Yes' : status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Column 2: Family History (Purple) */}
            <div className="bg-white rounded-xl border border-purple-100 overflow-hidden shadow-sm">
                <div className="bg-purple-50/50 px-6 py-4 border-b border-purple-100">
                    <h4 className="font-bold text-purple-800 uppercase text-xs tracking-wider">Family History</h4>
                </div>
                <div className="divide-y divide-gray-100">
                    {familyHistoryList.map((item, i) => {
                        const status = getStatus(item.key, item.default);
                        return (
                            <div key={i} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                                    <p className="text-[10px] text-gray-400">{item.sub}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${getStatusColor(status, 'family')}`}>
                                    {status === true ? 'Yes' : status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Column 3: Contraindications (Red/Theme) */}
            <div className="bg-white rounded-xl border border-red-100 overflow-hidden shadow-sm">
                <div className="bg-red-50/50 px-6 py-4 border-b border-red-100">
                    <h4 className="font-bold text-red-800 uppercase text-xs tracking-wider">Contraindications</h4>
                </div>
                <div className="divide-y divide-gray-100">
                    {contraindicationsList.map((item, i) => {
                        const status = getStatus(item.key, item.default);
                        // Contraindications logic: Often stored as boolean or string. If boolean true -> "DETECTED" (Red). If false -> "Clear" (Green).
                        // But user asked for specific format "Clear".
                        let displayStatus = status;
                        if (status === true || status === 'Yes') displayStatus = 'DETECTED';
                        if (status === false || status === 'No') displayStatus = 'Clear';
                        if (status === 'Clear') displayStatus = 'Clear'; // Enforce user preference if simple string

                        return (
                            <div key={i} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${displayStatus === 'DETECTED' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-50'}`}>
                                    {displayStatus}
                                </span>
                            </div>
                        );
                    })}
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
