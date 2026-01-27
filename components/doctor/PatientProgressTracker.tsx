
import React from 'react';
import { WeekLogEntry } from '../../constants';

interface PatientProgressTrackerProps {
    logs: WeekLogEntry[];
}

const WeightTrendChart: React.FC<{ logs: WeekLogEntry[] }> = ({ logs }) => {
    if (logs.length < 2) {
        return <div className="text-center text-sm text-gray-500 p-4">Not enough data for a chart.</div>;
    }

    const weights = logs.map(log => log.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const weightRange = maxWeight - minWeight === 0 ? 1 : maxWeight - minWeight;

    const points = logs.map((log, index) => {
        const x = (index / (logs.length - 1)) * 100;
        const y = 100 - ((log.weight - minWeight) / weightRange) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
             <h4 className="font-semibold text-gray-700 mb-2">Weight Trend (lbs)</h4>
            <svg viewBox="0 0 100 100" className="w-full h-24" preserveAspectRatio="none">
                <polyline
                    fill="none"
                    stroke="#C084FC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Week {logs[0].week} ({logs[0].weight}lbs)</span>
                <span>Week {logs[logs.length-1].week} ({logs[logs.length-1].weight}lbs)</span>
            </div>
        </div>
    );
};

const PatientProgressTracker: React.FC<PatientProgressTrackerProps> = ({ logs }) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Weekly Progress Logs</h2>
                <p className="text-gray-500">Patient has not submitted any weekly logs yet.</p>
            </div>
        );
    }
    
    // Ensure logs are sorted by week
    const sortedLogs = [...logs].sort((a, b) => a.week - b.week);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Progress Logs</h2>
            
            <WeightTrendChart logs={sortedLogs} />

            <div className="space-y-4 pr-2">
                {sortedLogs.map(log => (
                    <div key={log.week} className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex justify-between items-baseline mb-2">
                             <h3 className="font-bold text-brand-purple">Week {log.week}</h3>
                             <p className="text-sm font-semibold text-gray-800">Weight: {log.weight} lbs</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Side Effects</p>
                            <p className="text-sm text-gray-700 mt-1">{log.sideEffects || 'None reported.'}</p>
                        </div>
                         <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Patient Notes</p>
                            <p className="text-sm text-gray-700 mt-1">{log.notes || 'No notes.'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PatientProgressTracker;