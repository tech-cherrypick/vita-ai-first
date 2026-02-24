
import React from 'react';
import EligibilityQuiz from './EligibilityQuiz';

const StatCard = ({ title, value, desc }: { title: string, value: string, desc: string }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-extrabold text-brand-text mb-1">{value}</p>
        <p className="text-xs text-gray-600 leading-tight">{desc}</p>
    </div>
);

const HumanOutline = ({ variant }: { variant: 'western' | 'indian' }) => {
    return (
        <svg viewBox="0 0 100 200" className="w-full h-full overflow-visible">
            {/* Defs for gradients */}
            <defs>
                <linearGradient id="skinGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FDE6D8" />
                    <stop offset="100%" stopColor="#F5D0BA" />
                </linearGradient>
                <radialGradient id="visceralGradient" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.6" />
                </radialGradient>
            </defs>

            {/* Realistic Body Silhouette - Smoother Medical Style */}
            <path 
                d="M50,8 C56,8 61,13 61,20 C61,25 58,29 54,31 C63,33 72,38 74,46 C75,55 75,85 73,95 C72,85 70,60 68,55 C70,75 68,95 66,105 C66,125 66,150 64,192 L54,192 L54,135 Q50,130 46,135 L46,192 L36,192 C34,150 34,125 34,105 C32,95 30,75 32,55 C30,60 28,85 27,95 C25,85 25,55 26,46 C28,38 37,33 46,31 C42,29 39,25 39,20 C39,13 44,8 50,8 Z"
                fill="url(#skinGradient)" 
                stroke="#E5E7EB" 
                strokeWidth="1.5"
            />

            {/* Fat Distribution Overlay */}
            {variant === 'western' ? (
                <>
                    {/* Subcutaneous - Left Arm */}
                    <path 
                        d="M27,48 Q23,70 28,94 L31,94 Q29,70 31,55 Z" 
                        fill="#FCD34D" 
                        fillOpacity="0.4" 
                    />
                    {/* Subcutaneous - Right Arm */}
                    <path 
                        d="M73,48 Q77,70 72,94 L69,94 Q71,70 69,55 Z" 
                        fill="#FCD34D" 
                        fillOpacity="0.4" 
                    />

                    {/* Subcutaneous - Left Hip/Thigh Area */}
                    <path 
                        d="M32,55 Q22,75 24,105 L34,105 Q32,75 32,55 Z" 
                        fill="#FCD34D" 
                        fillOpacity="0.4" 
                    />
                    {/* Subcutaneous - Right Hip/Thigh Area */}
                     <path 
                        d="M68,55 Q78,75 76,105 L66,105 Q68,75 68,55 Z" 
                        fill="#FCD34D" 
                        fillOpacity="0.4" 
                    />

                    {/* Subcutaneous - Left Leg */}
                    <path 
                        d="M34,105 L36,190 L40,190 L39,105 Z" 
                        fill="#FCD34D" 
                        fillOpacity="0.4" 
                    />
                    {/* Subcutaneous - Right Leg */}
                    <path 
                        d="M66,105 L64,190 L60,190 L61,105 Z" 
                        fill="#FCD34D" 
                        fillOpacity="0.4" 
                    />
                </>
            ) : (
                <>
                    {/* Visceral Fat - Deep Abdominal Fat (The Indian Risk) */}
                    <ellipse cx="50" cy="82" rx="12" ry="16" fill="url(#visceralGradient)" filter="blur(4px)" />
                    <ellipse cx="50" cy="82" rx="9" ry="12" fill="#EF4444" fillOpacity="0.6" />
                    
                    {/* Ectopic Fat (Liver area) */}
                    <circle cx="46" cy="72" r="4" fill="#7F1D1D" fillOpacity="0.5" />
                </>
            )}
        </svg>
    );
};

const PhenotypeComparison = () => (
    <div className="my-8 p-6 bg-white rounded-3xl border border-gray-100 shadow-lg relative overflow-hidden group hover:shadow-xl transition-shadow">
        <div className="text-center mb-6">
            <h4 className="font-bold text-gray-800 text-lg">Same BMI (22), Different Risk</h4>
            <p className="text-xs text-gray-500">Why the scale lies to South Asians</p>
        </div>
        
        <div className="flex justify-center items-end gap-2 sm:gap-12 relative">
            
            {/* Western */}
            <div className="flex flex-col items-center w-32 sm:w-40 relative group/figure">
                <div className="h-64 w-full relative">
                    <HumanOutline variant="western" />
                    {/* Label pointing to subcutaneous */}
                    <div className="absolute top-[40%] left-0 w-full flex justify-center opacity-0 group-hover/figure:opacity-100 transition-opacity">
                        <span className="bg-yellow-100 text-yellow-800 text-[9px] font-bold px-2 py-1 rounded shadow-sm border border-yellow-200">Subcutaneous Fat</span>
                    </div>
                </div>
                <div className="text-center mt-2">
                    <p className="font-bold text-gray-700 text-sm">Western Phenotype</p>
                    <div className="inline-flex items-center gap-1 mt-1 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-[10px] font-bold text-green-700 uppercase">Metabolically Healthy</span>
                    </div>
                </div>
            </div>

            {/* VS Badge */}
            <div className="mb-12 font-black text-gray-200 text-xl italic">VS</div>

            {/* Indian */}
            <div className="flex flex-col items-center w-32 sm:w-40 relative group/figure">
                <div className="h-64 w-full relative">
                    <HumanOutline variant="indian" />
                    
                    {/* Animated Pulse Ring for Visceral Fat - Adjusted position for new body */}
                    <div className="absolute top-[28%] left-[50%] -translate-x-1/2 w-16 h-16 bg-red-500/20 rounded-full animate-ping pointer-events-none"></div>
                    
                    {/* Callout Line - Adjusted for new body */}
                    <div className="absolute top-[32%] right-[-10px] sm:right-[-40px] flex items-center">
                        <div className="w-8 h-[1px] bg-red-500"></div>
                        <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-bounce">
                            Hidden Visceral Fat
                        </div>
                    </div>
                </div>
                <div className="text-center mt-2">
                    <p className="font-bold text-gray-700 text-sm">Indian Phenotype</p>
                    <div className="inline-flex items-center gap-1 mt-1 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="text-[10px] font-bold text-red-700 uppercase">High Metabolic Risk</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex gap-4 justify-center border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-300/50 border border-yellow-400 rounded-sm"></div>
                <p className="text-[10px] text-gray-500"><strong>Subcutaneous:</strong> Safe fat under skin</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 border border-red-600 rounded-full"></div>
                <p className="text-[10px] text-gray-500"><strong>Visceral:</strong> Toxic fat around organs</p>
            </div>
        </div>
    </div>
);

const IndianPhenotype: React.FC = () => {
    return (
        <section className="py-20 bg-brand-bg relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                    {/* Left Column: Educational Content */}
                    <div>
                        <div className="inline-block bg-brand-purple/10 text-brand-purple px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                            🧬 Built for Indian Biology
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-brand-text tracking-tight mb-6">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-brand-purple">Thin-Fat</span> Paradox
                        </h2>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            Standard BMI charts don't tell the full story for South Asians. We are genetically predisposed to storing 
                            <strong> visceral fat</strong> (fat around organs) even at a "normal" body weight.
                        </p>
                        
                        <PhenotypeComparison />

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3">
                                <span className="mt-1 bg-red-100 text-red-600 rounded-full p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></span>
                                <div>
                                    <h4 className="font-bold text-gray-900">Standard BMI is Misleading</h4>
                                    <p className="text-sm text-gray-600">A BMI of 23 is considered overweight for Indians, compared to 25 globally.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-1 bg-red-100 text-red-600 rounded-full p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></span>
                                <div>
                                    <h4 className="font-bold text-gray-900">High Visceral Adiposity</h4>
                                    <p className="text-sm text-gray-600">Hidden belly fat drives insulin resistance and inflammation, even if you look thin.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-1 bg-green-100 text-green-600 rounded-full p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>
                                <div>
                                    <h4 className="font-bold text-gray-900">How GLP-1 Helps</h4>
                                    <p className="text-sm text-gray-600">Our protocol specifically targets visceral fat reduction and corrects insulin sensitivity.</p>
                                </div>
                            </li>
                        </ul>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <StatCard title="Diabetes Risk" value="4x" desc="Higher in South Asians vs. Caucasians" />
                            <StatCard title="Onset Age" value="-10 yrs" desc="Metabolic issues start earlier" />
                        </div>
                    </div>

                    {/* Right Column: Embedded Eligibility Quiz */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 to-brand-cyan/20 rounded-full blur-[80px]"></div>
                        <div className="relative z-10">
                            <EligibilityQuiz className="bg-white/90 backdrop-blur-xl border-white/60" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default IndianPhenotype;
