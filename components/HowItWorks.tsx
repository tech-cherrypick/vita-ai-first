
import React from 'react';

const FeatureCard = ({ icon, title, description, badge }: { icon: React.ReactNode, title: string, description: string, badge?: string }) => (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:border-brand-purple/20 transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
        {badge && (
            <div className="absolute top-4 right-4 bg-brand-purple/10 text-brand-purple text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {badge}
            </div>
        )}
        <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-brand-text mb-3">{title}</h3>
        <p className="text-brand-text-light text-sm leading-relaxed">{description}</p>
    </div>
);

const HowItWorks: React.FC = () => {
    return (
        <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
            {/* Decorative BG */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-purple/5 via-transparent to-transparent pointer-events-none"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-brand-text mb-6">
                        Why Choose Vita? <br/>
                        <span className="bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">Stopping the Rebound.</span>
                    </h2>
                    <p className="text-lg text-brand-text-light">
                        The biggest complaint about GLP-1s? "The weight comes back." <br/>
                        <span className="font-bold text-gray-900">Our program is designed to be different.</span> We focus on treating the metabolic root cause and building the muscle infrastructure to keep it off.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    
                    {/* Column 1: The Detective Work */}
                    <FeatureCard 
                        badge="Step 1: The Source"
                        icon="🕵️‍♂️"
                        title="Metabolic Detective Model"
                        description="We go deeper than BMI. By analyzing your weight loss history, family genetics, hormonal profile (PCOS/Thyroid), and psychographics, we identify exactly *why* your body holds onto weight."
                    />

                    {/* Column 2: Muscle Protection */}
                    <FeatureCard 
                        badge="Step 2: The Engine"
                        icon="💪"
                        title="MuscleProtect™ Protocol"
                        description="Rapid weight loss often burns muscle, slowing your metabolism and causing regain. Our strength-training module and protein-first coaching ensures you lose fat, not muscle."
                    />

                    {/* Column 3: Nutrition/Habits */}
                    <FeatureCard 
                        badge="Step 3: The Long Game"
                        icon="🥗"
                        title="Cultural Nutrition Coaching"
                        description="We don't give you a generic salad plan. We integrate with your lifestyle—including Indian staples—teaching you how to eat for satiety so habits stick even after treatment ends."
                    />

                    {/* Column 4: Technology Tools */}
                    <FeatureCard 
                        badge="Step 4: The Companion"
                        icon="📱"
                        title="Always-On Tech Stack"
                        description="Access world-class technology tools that serve as your constant companion. From real-time information to building newer habits and tracking granular progress, you're never on this journey alone."
                    />

                </div>

                {/* Bottom Banner for Holistic Context */}
                <div className="mt-12 bg-brand-bg rounded-3xl p-8 border border-brand-purple/10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-brand-text mb-2">Holistic Health History</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 font-medium">📉 Weight History</span>
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 font-medium">🧬 Family Genetics</span>
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 font-medium">🧠 Psychographics</span>
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 font-medium">🩸 Metabolic Labs</span>
                        </div>
                        <p className="text-sm text-gray-600">
                            We don't treat symptoms; we treat the system. By understanding the psychological and physiological drivers of your weight, we create a path out of the yo-yo cycle.
                        </p>
                    </div>
                    <div className="md:w-1/3 w-full">
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
                            <p className="text-3xl font-extrabold text-brand-purple mb-1">Target</p>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Highest Maintenance Rate</p>
                            <p className="text-xs text-gray-400 mt-2">Our protocol is designed to support long-term weight sustainability.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
