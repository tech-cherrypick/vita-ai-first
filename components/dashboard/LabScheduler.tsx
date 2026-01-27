
import React, { useState } from 'react';
import ConsultationScheduler from './ConsultationScheduler';

interface LabSchedulerProps {
    onSchedule: (dateTime: { date: Date; time: string }) => void;
}

const LabScheduler: React.FC<LabSchedulerProps> = ({ onSchedule }) => {
    return (
        <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tighter text-brand-text">Book Lab Test</h2>
            <p className="mt-4 text-lg text-brand-text-light max-w-2xl mx-auto">
                We need to build your Metabolic Fingerprint. Schedule a home sample collection or visit a partner center.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto text-sm text-left">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-900 font-semibold">🧬 Thyroid (TSH, T3, T4)</div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-green-900 font-semibold">🥗 Metabolic (HbA1c, Insulin)</div>
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-indigo-900 font-semibold">
                    <span className="block mb-1">🫀 Lipid Panel</span>
                    <span className="text-xs font-normal opacity-80">Cholesterol, LDL, HDL, TG, Lp(a), ApoB</span>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-red-900 font-semibold">
                    <span className="block mb-1">❤️ Cardiac & Inflammation</span>
                    <span className="text-xs font-normal opacity-80">hsCRP, BNP</span>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-purple-900 font-semibold">⚡ Adrenal (Cortisol)</div>
                <div className="bg-pink-50 p-3 rounded-lg border border-pink-100 text-pink-900 font-semibold">🚺 Hormonal (PCOS check)</div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-900 font-semibold">🛡️ Safety (Liver, Kidney)</div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-900 font-semibold">🧠 Psych Profiling</div>
            </div>
            
            <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-100 inline-block text-left">
                <h4 className="font-bold text-green-800 mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>
                    Home Collection Available
                </h4>
                <p className="text-sm text-green-700">A phlebotomist will visit your registered address for sample collection at no extra cost.</p>
            </div>

            <div className="mt-8">
              <ConsultationScheduler 
                onSchedule={onSchedule} 
                minBookingNoticeDays={1} 
                buttonText="Schedule Home Collection"
              />
            </div>
            <div className="mt-4">
                <button 
                    onClick={() => onSchedule({ date: new Date(), time: '09:00 AM' })}
                    className="text-brand-purple/60 hover:text-brand-purple text-sm font-medium transition-colors cursor-pointer"
                >
                    Prefer to visit a lab center?
                </button>
            </div>
        </div>
    );
};

export default LabScheduler;
