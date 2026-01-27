
import React from 'react';
import { howItWorksSteps } from '../constants';

const HowItWorks: React.FC = () => {
    return (
        <section className="py-20 sm:py-28 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-brand-text">
                        The Metabolic <span className="bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent">Detective</span> Model
                    </h2>
                    <p className="mt-4 text-lg text-brand-text-light max-w-2xl mx-auto">
                        A data-driven, 5-step approach to diagnosing and treating the root cause of your weight.
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto">
                    {howItWorksSteps.map((step, index) => (
                        <div key={index} className="flex-1 min-w-[300px] max-w-sm bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-gray-200/60 transition-shadow duration-300 flex flex-col text-left animate-slide-in-up" style={{ animationDelay: `${index * 150}ms`}}>
                            {step.icon}
                            <h3 className="text-sm font-bold text-brand-pink tracking-widest">{step.step.toUpperCase()}</h3>
                            <h4 className="text-xl font-bold mt-1 mb-3 text-brand-text">{step.title}</h4>
                            <p className="text-brand-text-light text-sm">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
