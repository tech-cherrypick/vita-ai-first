
import React, { useState } from 'react';
import WeightLossGraph from './WeightLossGraph';
import ConsultationScheduler from './dashboard/ConsultationScheduler';
import VitaLiveScreener from './VitaLiveScreener';

type Unit = 'kg';
type ResultsData = {
    bmi: number;
    currentWeight: number;
    projectedWeight: number;
    weightLoss: number;
    unit: Unit;
};

const GradientButton: React.FC<{ children: React.ReactNode, onClick?: () => void, type?: "button" | "submit" | "reset", className?: string, disabled?: boolean }> = ({ children, onClick, type = "button", className = "", disabled = false }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan bg-[length:200%_auto] rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-purple/20 animate-gradient-x ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {children}
    </button>
);

const BmiScale: React.FC<{ bmi: number; isSouthAsian?: boolean }> = ({ bmi, isSouthAsian = false }) => {
    // Adjust zones based on phenotype
    // Standard: Healthy 18.5-25, Overweight 25-30, Obese >30
    // South Asian (WHO/ADA guidelines): Healthy 18.5-23, Overweight 23-27.5 (approx), Obese >27.5 (approx)
    // We map these to the visual bar for better user feedback.

    const range = 30; // Scale from BMI 15 to 45
    const start = 15;

    const healthyCutoff = isSouthAsian ? 23 : 25;
    const overweightCutoff = isSouthAsian ? 27.5 : 30;

    const w1 = ((18.5 - start) / range) * 100; // Underweight
    const w2 = ((healthyCutoff - 18.5) / range) * 100; // Healthy
    const w3 = ((overweightCutoff - healthyCutoff) / range) * 100; // Overweight
    // Ensure w4 takes the rest, but prevent negative values if logic is weird
    const w4 = Math.max(0, 100 - w1 - w2 - w3); // Obese

    const getBmiPosition = () => {
        const clampedBmi = Math.max(15, Math.min(45, bmi));
        return ((clampedBmi - 15) / 30) * 100;
    };
    const position = getBmiPosition();

    return (
        <div className="w-full my-8 animate-fade-in">
            <div className="relative h-6 rounded-full flex overflow-hidden">
                <div style={{ width: `${w1}%` }} className="bg-blue-400 transition-all duration-500"></div>
                <div style={{ width: `${w2}%` }} className="bg-green-400 transition-all duration-500"></div>
                <div style={{ width: `${w3}%` }} className="bg-yellow-400 transition-all duration-500"></div>
                <div style={{ width: `${w4}%` }} className="flex-1 bg-red-400 transition-all duration-500"></div>
                <div className="absolute top-0 h-full" style={{ left: `calc(${position}% - 2px)` }}>
                    <div className="w-1 h-full bg-purple-600 ring-2 ring-white"></div>
                </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span>Underweight</span>
                <span>Healthy</span>
                <span>Overweight</span>
                <span>Obese</span>
            </div>
            {isSouthAsian && (
                <p className="text-[10px] text-gray-400 text-center mt-1">*Scale adjusted for South Asian metabolic risk factors</p>
            )}
        </div>
    );
};


interface EligibilityQuizProps {
    className?: string;
}

const EligibilityQuiz: React.FC<EligibilityQuizProps> = ({ className = "" }) => {
    const [isVideoMode, setIsVideoMode] = useState(false);
    const [step, setStep] = useState(1); // 1: Vitals, 2: Results, 3: Schedule, 4: Confirmed
    const [heightFt, setHeightFt] = useState<string>('5');
    const [heightIn, setHeightIn] = useState<string>('9');
    const [weight, setWeight] = useState<string>('85');
    const [unit] = useState<Unit>('kg');

    // New state for phenotype checks
    const [isSouthAsian, setIsSouthAsian] = useState(false);
    const [hasAbdominalFat, setHasAbdominalFat] = useState(false);

    const [results, setResults] = useState<ResultsData | null>(null);
    const [isEligible, setIsEligible] = useState<boolean | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmedDateTime, setConfirmedDateTime] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const quizSteps = [
        { id: 1, name: 'Vitals' },
        { id: 2, name: 'Results' },
        { id: 3, name: 'Schedule' },
        { id: 4, name: 'Confirmed' },
    ];


    const calculateBmi = (e: React.FormEvent) => {
        e.preventDefault();
        const hFt = parseInt(heightFt);
        const hIn = parseInt(heightIn);
        const wt = parseInt(weight);

        if (hFt > 0 && wt > 0) {
            const totalInches = (hFt * 12) + (hIn || 0);
            if (totalInches > 0) {
                const heightInMeters = totalInches * 0.0254;
                const calculatedBmi = wt / (heightInMeters * heightInMeters);

                // Eligibility Logic
                // Standard: BMI >= 27
                // South Asian: BMI >= 25 (Lower threshold due to higher visceral adiposity risk)
                let threshold = 27;
                if (isSouthAsian) {
                    threshold = 25;
                }

                if (calculatedBmi >= threshold) {
                    const currentWt = parseFloat(weight);
                    const weightLoss = currentWt * 0.20;
                    const projectedWeight = currentWt - weightLoss;

                    setResults({ bmi: calculatedBmi, currentWeight: currentWt, projectedWeight, weightLoss, unit });
                    setIsEligible(true);
                } else {
                    setResults({ bmi: calculatedBmi, currentWeight: wt, projectedWeight: wt, weightLoss: 0, unit });
                    setIsEligible(false);
                }
                setStep(2);
            }
        }
    };

    const handleSchedule = async (dateTime: { date: Date; time: string }) => {
        setIsConfirming(true);
        const formattedDateTime = `${dateTime.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${dateTime.time}`;
        setConfirmedDateTime(formattedDateTime);
        // Simulate network request to save appointment
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsConfirming(false);
        setStep(4);
    };

    const resetQuiz = () => {
        setStep(1);
        setHeightFt('5');
        setHeightIn('9');
        setWeight('85');
        setIsSouthAsian(false);
        setHasAbdominalFat(false);
        setResults(null);
        setIsEligible(null);
        setName('');
        setEmail('');
        setPhone('');
    };

    const handleScreenerComplete = (details: { date: string; time: string; vitals: any }) => {
        setIsVideoMode(false);
        if (details.date !== 'Pending' && details.time !== 'Pending') {
            let dateStr = details.date;
            if (dateStr.toLowerCase() === 'tomorrow') {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            }

            const formatted = `${dateStr} at ${details.time}`;
            setConfirmedDateTime(formatted);
            setStep(4); // Confirmed step
        }

        if (details.vitals) {
            if (details.vitals.weight) setWeight(details.vitals.weight.toString());
            if (details.vitals.heightFt) setHeightFt(details.vitals.heightFt.toString());
            if (details.vitals.heightIn) setHeightIn(details.vitals.heightIn.toString());
            // Pre-fill contact details from live session
            if (details.vitals.name) setName(details.vitals.name);
            if (details.vitals.email) setEmail(details.vitals.email);
            if (details.vitals.phone) setPhone(details.vitals.phone);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="animate-fade-in">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-brand-text mb-2">Check Your Eligibility</h2>
                            <p className="text-brand-text-light">Start your journey today.</p>
                        </div>

                        {/* Video Call Entry Point */}
                        <div className="mb-8 p-1 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer" onClick={() => setIsVideoMode(true)}>
                            <div className="bg-white rounded-xl p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center text-3xl shadow-sm border border-gray-100 relative">
                                        👩🏽‍⚕️
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Talk to Vita</h3>
                                        <p className="text-xs text-gray-500">Live AI Eligibility Screening</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="relative mb-8 text-center">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-2 bg-white text-sm text-gray-500">Or continue with form</span>
                            </div>
                        </div>

                        <form onSubmit={calculateBmi} className="space-y-6 max-w-sm mx-auto">
                            <div>
                                <label htmlFor="height-ft" className="block text-sm font-semibold text-brand-text mb-2">Height</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <input type="number" name="height-ft" id="height-ft" className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="5" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} required min="3" max="8" />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-500 sm:text-sm">ft</span></div>
                                    </div>
                                    <div className="relative">
                                        <input type="number" name="height-in" id="height-in" className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="9" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} min="0" max="11" />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-500 sm:text-sm">in</span></div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="weight" className="block text-sm font-semibold text-brand-text mb-2">Weight</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-grow">
                                        <input type="number" name="weight" id="weight" className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="85" value={weight} onChange={(e) => setWeight(e.target.value)} required min="20" max="320" />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-500 sm:text-sm">{unit}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center mt-1">
                                        <input
                                            type="checkbox"
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-brand-purple checked:bg-brand-purple"
                                            checked={isSouthAsian}
                                            onChange={(e) => setIsSouthAsian(e.target.checked)}
                                        />
                                        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-semibold text-brand-text block">I am of South Asian descent</span>
                                        <span className="text-gray-500 text-xs">BMI eligibility criteria may be adjusted for your phenotype.</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center mt-1">
                                        <input
                                            type="checkbox"
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-brand-purple checked:bg-brand-purple"
                                            checked={hasAbdominalFat}
                                            onChange={(e) => setHasAbdominalFat(e.target.checked)}
                                        />
                                        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-semibold text-brand-text block">I have stubborn belly fat (Abdominal Obesity)</span>
                                        <span className="text-gray-500 text-xs">Visceral fat is a key indicator for metabolic health.</span>
                                    </div>
                                </label>
                            </div>

                            <GradientButton type="submit">See Your Results</GradientButton>
                        </form>
                    </div>
                );
            case 2:
                if (!results) return null;
                return (
                    <div className="animate-fade-in text-center">
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-brand-text">Your Result</h2>
                        <BmiScale bmi={results.bmi} isSouthAsian={isSouthAsian} />
                        {isEligible ? (
                            <>
                                <div className="bg-green-50 text-green-800 p-4 rounded-2xl text-center animate-slide-in-up">
                                    <p className="font-bold text-lg"><span className="text-2xl mr-2">🎉</span>Congrats! You're likely eligible.</p>
                                    <p className="mt-1 text-green-700">Your BMI of {results.bmi.toFixed(1)} falls within the qualifying range.</p>

                                    {isSouthAsian && results.bmi < 27 && (
                                        <div className="mt-3 text-xs bg-green-100 p-2 rounded-lg text-green-800 border border-green-200">
                                            <span className="font-bold">Note:</span> We adjusted your eligibility criteria based on your South Asian phenotype, which has different metabolic risk factors associated with BMI.
                                        </div>
                                    )}
                                    {hasAbdominalFat && (
                                        <div className="mt-2 text-xs bg-brand-purple/10 p-2 rounded-lg text-brand-purple border border-brand-purple/20">
                                            <span className="font-bold">Targeting Belly Fat:</span> GLP-1 therapy is particularly effective at reducing visceral abdominal fat.
                                        </div>
                                    )}
                                </div>
                                <div className="my-8 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                                    <WeightLossGraph startWeight={results.currentWeight} endWeight={results.projectedWeight} unit={results.unit} />
                                </div>
                                <GradientButton className="mt-8" onClick={() => setStep(3)}>Schedule Free Consult</GradientButton>
                            </>
                        ) : (
                            <div className="mt-6 text-center text-red-600 bg-red-50 p-4 rounded-lg">
                                <p className="font-semibold">You may not be a candidate yet.</p>
                                <p className="text-sm">Your BMI is {results.bmi.toFixed(1)}. Please consult your doctor for other options.</p>
                            </div>
                        )}
                        <button onClick={() => setStep(1)} className="mt-4 text-sm text-brand-purple hover:underline">Edit Vitals</button>
                    </div>
                );
            case 3:
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-center mb-2 text-brand-text">Schedule Your Free Consult</h2>
                        <p className="text-center text-brand-text-light mb-6 max-w-md mx-auto">First, tell us who you are. Then book a no-obligation call with our care team.</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-brand-text mb-1">Full Name</label>
                                <input type="text" name="name" id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-brand-text mb-1">Email Address</label>
                                <input type="email" name="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane.doe@example.com" className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-semibold text-brand-text mb-1">Phone Number</label>
                                <input type="tel" name="phone" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(555) 123-4567" className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-3 px-4 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" />
                            </div>
                        </div>

                        {isConfirming ? (
                            <div className="flex flex-col items-center justify-center text-center min-h-[300px]">
                                <svg className="animate-spin h-10 w-10 text-brand-purple mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <p className="font-semibold text-brand-text">Confirming your appointment...</p>
                            </div>
                        ) : (
                            <ConsultationScheduler
                                onSchedule={handleSchedule}
                                minBookingNoticeDays={0}
                                isButtonDisabled={!name || !email || !phone}
                            />
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="animate-fade-in text-center min-h-[300px] flex flex-col justify-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-brand-text">Appointment Booked!</h2>
                        <p className="mt-4 text-lg text-brand-text-light max-w-md mx-auto">Your consultation is confirmed for:<br /><span className="font-semibold text-brand-purple">{confirmedDateTime}</span></p>
                        <p className="mt-2 text-brand-text-light max-w-md mx-auto">You'll receive an email with a meeting link at <span className="font-semibold text-brand-text">{email}</span>. A care coordinator will provide you with login details after your call.</p>
                        <button onClick={resetQuiz} className="mt-8 w-full px-6 py-3 text-base font-bold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition-colors">
                            Start Over
                        </button>
                    </div>
                )
            default:
                return null;
        }
    };

    if (isVideoMode) {
        return <VitaLiveScreener onClose={() => setIsVideoMode(false)} onComplete={handleScreenerComplete} />;
    }

    return (
        <section id="eligibility-quiz" className={`py-20 sm:py-28 bg-blur-gradient-wrapper ${className}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mx-auto bg-white/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-2xl shadow-gray-300/30 border border-gray-200">
                    <div className="flex justify-around mb-8 border-b border-gray-200">
                        {quizSteps.map((s) => (
                            <div key={s.id} className="text-center flex-1 pb-3 border-b-4" style={{ borderColor: step >= s.id ? '#C084FC' : 'transparent', color: step >= s.id ? '#111827' : '#6B7280' }}>
                                <span className={`text-xs font-semibold uppercase tracking-wider transition-colors`}>{s.name}</span>
                            </div>
                        ))}
                    </div>
                    {renderStep()}
                </div>
            </div>
        </section>
    );
};

export default EligibilityQuiz;
