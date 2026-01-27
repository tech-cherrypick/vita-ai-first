import React from 'react';
import { VitaLogo } from '../constants';

interface DoctorLoginPageProps {
    onSignIn: () => void;
    onBack: () => void;
}

const DoctorLoginPage: React.FC<DoctorLoginPageProps> = ({ onSignIn, onBack }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSignIn();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <VitaLogo />
                    <h2 className="mt-4 text-2xl font-bold text-gray-800">Doctor Portal Login</h2>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address</label>
                            <div className="mt-1">
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    required 
                                    defaultValue="dr.mitchell@vita.health"
                                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" 
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-semibold text-gray-700">Password</label>
                            <div className="mt-1">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    required
                                    defaultValue="password123"
                                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" 
                                />
                            </div>
                        </div>
                        <div>
                            <button 
                                type="submit"
                                className="w-full flex items-center justify-center px-6 py-3 text-lg font-bold text-white bg-brand-purple rounded-xl transition-all duration-300 hover:opacity-90 shadow-lg shadow-brand-purple/30">
                                Sign In
                            </button>
                        </div>
                    </form>
                </div>
                <div className="text-center mt-6">
                    <button onClick={onBack} className="text-sm font-medium text-brand-purple hover:underline">
                        &larr; Back to main site
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorLoginPage;