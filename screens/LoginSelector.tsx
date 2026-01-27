import React from 'react';
import { VitaLogo } from '../constants';

interface LoginSelectorProps {
    onSelect: (type: 'consumer' | 'doctor') => void;
}

const LoginSelector: React.FC<LoginSelectorProps> = ({ onSelect }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-blur-gradient-wrapper p-4">
             <div className="text-center mb-12 animate-fade-in">
                <VitaLogo />
                <p className="mt-2 text-brand-text-light">Your journey to wellness starts here.</p>
            </div>

            <div className="w-full max-w-sm space-y-6">
                 <button 
                    onClick={() => onSelect('consumer')}
                    className="w-full text-left p-6 bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-brand-purple transition-all duration-300 group animate-slide-in-up"
                    style={{ animationDelay: '200ms' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-brand-text">Patient Portal</h2>
                            <p className="text-brand-text-light mt-1">Access your treatment plan and track your progress.</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-brand-purple transition-colors">&#8594;</span>
                    </div>
                </button>

                 <button 
                    onClick={() => onSelect('doctor')}
                    className="w-full text-left p-6 bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-brand-purple transition-all duration-300 group animate-slide-in-up"
                    style={{ animationDelay: '400ms' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-brand-text">Doctor Portal</h2>
                            <p className="text-brand-text-light mt-1">Manage your patients and review their progress.</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-brand-purple transition-colors">&#8594;</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default LoginSelector;