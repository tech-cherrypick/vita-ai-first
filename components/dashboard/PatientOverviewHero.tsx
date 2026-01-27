
import React from 'react';
import { Patient } from '../../constants';

interface PatientOverviewHeroProps {
    patient: Patient;
    isProfileComplete: boolean;
    missingFields: string[];
    onOpenChat: () => void;
}

const JourneyProgressGraph: React.FC<{ start: number; current: number; goal: number }> = ({ start, current, goal }) => {
    // 1. Calculate Progress
    const totalToLose = start - goal;
    const lostSoFar = start - current;
    // Clamp percentage between 0 and 1 (0% to 100%)
    let progress = 0;
    if (totalToLose > 0) {
        progress = Math.max(0, Math.min(1, lostSoFar / totalToLose));
    }

    // 2. SVG Geometry
    const width = 600;
    const height = 120;
    const paddingX = 60;
    const startY = 30; // Top (Heavier)
    const endY = 90;   // Bottom (Lighter)
    const startX = paddingX;
    const endX = width - paddingX;

    // Quadratic Bezier Control Point (creates the "curve" shape)
    // Pulling the control point X towards the start creates a "rapid initial loss" curve shape common in GLP-1
    const cpX = startX + (endX - startX) * 0.4; 
    const cpY = endY; 

    // 3. Calculate Current Point on Curve (B(t))
    // Quadratic Bezier Formula: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const t = progress;
    const mt = 1 - t;
    
    const currX = (mt * mt * startX) + (2 * mt * t * cpX) + (t * t * endX);
    const currY = (mt * mt * startY) + (2 * mt * t * cpY) + (t * t * endY);

    return (
        <div className="w-full select-none">
            <div className="relative w-full aspect-[4/1] sm:aspect-[6/1] max-h-[160px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#C084FC" />
                            <stop offset="100%" stopColor="#5EEAD4" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Base Guideline (Dotted) */}
                    <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#E5E7EB" strokeWidth="2" strokeDasharray="6 6" />

                    {/* The Ideal Curve */}
                    <path 
                        d={`M ${startX},${startY} Q ${cpX},${cpY} ${endX},${endY}`}
                        fill="none"
                        stroke="#F3F4F6"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                    
                    {/* Active Progress Path (Masked or Partial) - Simplified to just the full curve in brand color for now, or segmenting */}
                    {/* For visual simplicity, we draw the full curve in a light color, and the "Traveled" part could be darker, 
                        but calculating the path segment for Bezier is complex in simple SVG. 
                        Instead, we use the dot to indicate position. 
                    */}
                    <path 
                        d={`M ${startX},${startY} Q ${cpX},${cpY} ${endX},${endY}`}
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity="0.3"
                    />

                    {/* Start Point */}
                    <circle cx={startX} cy={startY} r="4" fill="#9CA3AF" />
                    <text x={startX} y={startY - 15} textAnchor="middle" className="text-[10px] fill-gray-400 font-bold uppercase">Start</text>
                    <text x={startX} y={startY + 20} textAnchor="middle" className="text-xs fill-gray-600 font-bold">{start} lbs</text>

                    {/* Goal Point */}
                    <circle cx={endX} cy={endY} r="4" fill="#9CA3AF" />
                    <text x={endX} y={endY - 15} textAnchor="middle" className="text-[10px] fill-gray-400 font-bold uppercase">Goal</text>
                    <text x={endX} y={endY + 20} textAnchor="middle" className="text-xs fill-gray-600 font-bold">{goal} lbs</text>

                    {/* Current Position Marker (Animated) */}
                    <g filter="url(#glow)">
                        <circle cx={currX} cy={currY} r="8" fill="white" stroke="#C084FC" strokeWidth="3" className="animate-pulse" />
                        <circle cx={currX} cy={currY} r="3" fill="#C084FC" />
                    </g>
                    
                    {/* Current Label Tag */}
                    <g transform={`translate(${currX}, ${currY - 25})`}>
                        <rect x="-35" y="-22" width="70" height="22" rx="6" fill="#111827" />
                        <text x="0" y="-7" textAnchor="middle" className="text-[10px] fill-white font-bold">You are here</text>
                        {/* Little triangle pointer */}
                        <path d="M -4,0 L 0,4 L 4,0 Z" fill="#111827" />
                    </g>
                    
                    {/* Current Weight Label below dot */}
                    <text x={currX} y={currY + 20} textAnchor="middle" className="text-sm fill-brand-purple font-extrabold">{current} lbs</text>

                </svg>
            </div>
            
            {/* Legend / Stats Text */}
            <div className="flex justify-center gap-8 mt-2 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span> Ideal Trajectory
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-purple"></span> Your Progress ({(progress * 100).toFixed(0)}%)
                </span>
            </div>
        </div>
    );
};

const PatientOverviewHero: React.FC<PatientOverviewHeroProps> = ({ patient, isProfileComplete, missingFields, onOpenChat }) => {
    // 1. Determine Weight Data from Logs vs Initial Vitals
    const hasLogs = patient.weeklyLogs && patient.weeklyLogs.length > 0;
    // Sort logs by week descending to get the latest
    const sortedLogs = hasLogs ? [...patient.weeklyLogs].sort((a, b) => b.week - a.week) : [];
    const latestLog = sortedLogs.length > 0 ? sortedLogs[0] : null;

    // Initial Baseline Vitals (from Intake/Doctor Input)
    const baselineWeightVital = patient.vitals.find(v => v.label === 'Weight');
    const baselineBmiVital = patient.vitals.find(v => v.label === 'BMI');
    
    const baselineWeight = parseFloat(baselineWeightVital?.value || '0');
    const baselineBMI = parseFloat(baselineBmiVital?.value || '0');

    // Current State
    const currentWeight = latestLog ? latestLog.weight : baselineWeight;
    const weightDifference = baselineWeight - currentWeight; // Positive means weight loss
    
    // Parse Goal Weight from string (e.g. "Lose 40 lbs" or "Target: 180 lbs")
    // If goal is "Lose 40 lbs", goal weight = baseline - 40.
    // If goal is number based, assume it's target. 
    // For this mock, we'll parse "Lose X lbs" logic from the `goal` string or fallback.
    let goalWeight = baselineWeight - 30; // Default fallback
    const loseMatch = patient.goal.match(/Lose (\d+)/i);
    if (loseMatch) {
        goalWeight = baselineWeight - parseInt(loseMatch[1]);
    }

    // 2. Dynamic BMI Calculation
    // Formula: BMI = kg / m^2. 
    // We reverse engineer height from baseline stats to calculate new BMI dynamically.
    let dynamicBMI = baselineBMI;
    if (baselineWeight > 0 && baselineBMI > 0) {
        // Convert lbs to kg (approx 0.453592)
        const baselineKg = baselineWeight * 0.453592;
        // Height (m) = sqrt(weight / BMI)
        const heightMeters = Math.sqrt(baselineKg / baselineBMI);
        
        // Calculate new BMI
        const currentKg = currentWeight * 0.453592;
        const newBmiCalc = currentKg / (heightMeters * heightMeters);
        dynamicBMI = parseFloat(newBmiCalc.toFixed(1));
    }

    // 3. Source & Timestamp
    const lastUpdatedLabel = latestLog 
        ? `Week ${latestLog.week} Check-in` 
        : 'Initial Assessment';

    return (
        <div className="animate-fade-in space-y-6">
             {/* Profile Nudge */}
             {!isProfileComplete && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-in-up">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <p className="font-bold text-orange-800">Your profile is incomplete</p>
                            <p className="text-sm text-orange-700">Please complete: <span className="font-semibold">{missingFields.join(', ')}</span></p>
                        </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap">
                        Complete Profile
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300 relative overflow-hidden group h-full">
                    <div className="relative z-10 flex items-center gap-5">
                         <div className="relative">
                            <img src={patient.imageUrl} alt={patient.name} className="w-20 h-20 rounded-full object-cover border-4 border-brand-purple/10" />
                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-brand-text leading-tight">{patient.name}</h2>
                            <p className="text-sm text-brand-text-light mt-1">{patient.age} years • {patient.goal}</p>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-brand-purple/10 text-brand-purple`}>
                                {patient.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Vitals Summary */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300 h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Health Snapshot</h3>
                        <span className="text-xs text-brand-purple bg-brand-purple/5 px-2 py-1 rounded-lg">{lastUpdatedLabel}</span>
                    </div>
                    <div className="flex justify-between items-end divide-x divide-gray-100">
                        <div className="pr-4">
                            <p className="text-3xl font-extrabold text-brand-text">{currentWeight} <span className="text-lg font-medium text-gray-400">lbs</span></p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Current Weight</p>
                        </div>
                        <div className="px-4 text-center">
                             <p className="text-3xl font-extrabold text-brand-cyan">{dynamicBMI}</p>
                             <p className="text-xs text-gray-500 mt-1 font-medium">BMI</p>
                        </div>
                        <div className="pl-4 text-right">
                            <p className={`text-3xl font-extrabold ${weightDifference > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                {weightDifference > 0 ? '-' : ''}{Math.abs(Number(weightDifference.toFixed(1)))} <span className="text-lg font-medium text-gray-400">lbs</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Total Loss</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Graph Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">📉</span> Your Progress Journey
                    </h3>
                    <div className="text-xs font-semibold text-brand-purple bg-brand-purple/5 px-3 py-1.5 rounded-full">
                        {Math.round(((baselineWeight - currentWeight) / (baselineWeight - goalWeight)) * 100)}% to Goal
                    </div>
                </div>
                
                <JourneyProgressGraph 
                    start={baselineWeight} 
                    current={currentWeight} 
                    goal={goalWeight} 
                />
            </div>
        </div>
    );
};

export default PatientOverviewHero;
