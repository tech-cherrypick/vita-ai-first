import React from 'react';
import { Patient } from '../../constants';

const ProgressSummary: React.FC<{ patient: Patient }> = ({ patient }) => {
    // Ensure logs are sorted from week 1 to latest
    const sortedLogs = [...patient.weeklyLogs].sort((a, b) => a.week - b.week);

    if (sortedLogs.length === 0) {
        return (
            <div className="p-6 bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-lg shadow-gray-200/30 text-center">
                <h3 className="text-xl font-bold text-brand-text mb-2">Your Progress</h3>
                <p className="text-sm text-brand-text-light">Log your first week's weight in the timeline to start tracking your progress!</p>
            </div>
        );
    }

    const startingWeight = sortedLogs[0].weight;
    const currentWeight = sortedLogs[sortedLogs.length - 1].weight;
    const totalLoss = startingWeight - currentWeight;
    const currentBmi = patient.vitals.find(v => v.label === 'BMI')?.value || 'N/A';
    
    // Parse goal
    const goalMatch = patient.goal.match(/\d+/);
    const goalWeightLoss = goalMatch ? parseInt(goalMatch[0], 10) : 0;
    const goalProgressPercent = goalWeightLoss > 0 ? Math.min((totalLoss / goalWeightLoss) * 100, 100) : 0;

    const StatCard: React.FC<{ label: string; value: string; unit?: string }> = ({ label, value, unit }) => (
        <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs font-semibold text-brand-text-light">{label}</p>
            <p className="text-2xl font-bold text-brand-purple">
                {value}
                {unit && <span className="text-base font-semibold text-brand-text-light ml-1">{unit}</span>}
            </p>
        </div>
    );

    return (
        <div className="p-6 bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-lg shadow-gray-200/30">
            <h3 className="text-xl font-bold text-brand-text mb-4">Your Progress</h3>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
                <StatCard label="Current" value={String(currentWeight)} unit="lbs" />
                <StatCard label="Lost" value={`${totalLoss > 0 ? '-' : ''}${Math.abs(totalLoss)}`} unit="lbs" />
                <StatCard label="BMI" value={currentBmi} />
            </div>

            {goalWeightLoss > 0 && (
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-sm font-bold text-brand-text">Progress to Goal</h4>
                        <span className="text-xs font-semibold text-brand-text-light">{patient.goal}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className="bg-brand-cyan h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${goalProgressPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-right text-brand-text-light mt-1">
                        {totalLoss.toFixed(1)} lbs of {goalWeightLoss} lbs
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProgressSummary;