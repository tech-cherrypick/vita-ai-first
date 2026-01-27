import React from 'react';
import { Vital } from '../../constants';

interface PatientVitalsProps {
    vitals: Vital[];
}

const TrendIcon: React.FC<{ trend?: 'up' | 'down' | 'stable' }> = ({ trend }) => {
    if (trend === 'up') return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
    if (trend === 'down') return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
    if (trend === 'stable') return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" /></svg>;
    return null;
}

const PatientVitals: React.FC<PatientVitalsProps> = ({ vitals }) => {
    return (
         <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Key Vitals</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                {vitals.map(vital => (
                    <div key={vital.label}>
                        <p className="text-sm text-gray-500">{vital.label}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-bold text-gray-900">{vital.value}</p>
                            {vital.unit && <p className="text-sm text-gray-600">{vital.unit}</p>}
                            <TrendIcon trend={vital.trend} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PatientVitals;