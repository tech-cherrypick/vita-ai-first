
import React, { useState } from 'react';
import { VitaLogo } from '../constants';

interface PatientLoginPageProps {
    onSignIn: (details: { name: string; email: string; phone: string }) => void;
    onBack: () => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const PatientLoginPage: React.FC<PatientLoginPageProps> = ({ onSignIn, onBack }) => {
    const [step, setStep] = useState<'auth' | 'phone'>('auth');
    const [isLoading, setIsLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [googleUser, setGoogleUser] = useState<{ name: string; email: string } | null>(null);

    const handleGoogleSignIn = () => {
        setIsLoading(true);
        // Simulate Google Auth popup/redirect delay and data retrieval
        setTimeout(() => {
            setIsLoading(false);
            setGoogleUser({
                name: "Alex Doe", // Simulated return from Google
                email: "alex.doe@example.com"
            });
            setStep('phone');
        }, 1500);
    };

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) return;
        
        setIsLoading(true);
        // Simulate verification/saving
        setTimeout(() => {
            if (googleUser) {
                onSignIn({
                    name: googleUser.name,
                    email: googleUser.email,
                    phone: phone
                });
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg relative overflow-hidden p-4">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-purple/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-cyan/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/50 relative z-10 animate-slide-in-up">
                
                <div className="text-center mb-8">
                    <div className="mb-6 inline-block scale-110">
                        <VitaLogo />
                    </div>
                    {step === 'auth' ? (
                        <>
                            <h2 className="text-2xl font-extrabold text-brand-text tracking-tight">Welcome Back</h2>
                            <p className="text-brand-text-light mt-2 text-sm">Sign in to access your care plan.</p>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl animate-bounce">
                                    👋
                                </div>
                            </div>
                            <h2 className="text-2xl font-extrabold text-brand-text tracking-tight">Hi, {googleUser?.name.split(' ')[0]}</h2>
                            <p className="text-brand-text-light mt-2 text-sm">Secure your account with your phone number.</p>
                        </>
                    )}
                </div>

                {step === 'auth' ? (
                    <div className="space-y-6">
                        <button 
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-4 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    <GoogleIcon />
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>
                        
                        <div className="text-center text-xs text-gray-400 max-w-xs mx-auto">
                            By continuing, you agree to our <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handlePhoneSubmit} className="space-y-6 animate-fade-in">
                        <div className="space-y-1.5">
                            <label htmlFor="phone" className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Mobile Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium border-r border-gray-200 pr-3">+91</span>
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    name="phone" 
                                    required 
                                    autoFocus
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="block w-full rounded-xl border border-gray-200 bg-white/50 text-gray-900 py-3.5 pl-16 pr-4 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all outline-none shadow-sm hover:bg-white text-lg tracking-wide placeholder-gray-300" 
                                    placeholder="00000 00000"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading || phone.length < 10}
                            className="w-full flex items-center justify-center px-6 py-4 text-lg font-bold text-white bg-brand-text rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Profile...
                                </span>
                            ) : (
                                <>
                                    Complete Setup
                                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </>
                            )}
                        </button>
                        
                        <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => setStep('auth')} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                                Use a different account
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <button onClick={onBack} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 mx-auto">
                        <span>←</span> Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientLoginPage;
