
import React from 'react';
import { whyGlp1Benefits } from '../constants';

const WhyGLP1: React.FC = () => {
    return (
        <section className="py-20 sm:py-28 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-brand-text">
                        The GLP-1 <span className="bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent"> Glow Up </span>, Explained
                    </h2>
                    <p className="mt-4 text-lg text-brand-text-light max-w-2xl mx-auto">
                        This isn't just another diet. GLP-1s work with your body's biology to create real, sustainable change.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {whyGlp1Benefits.map((benefit, index) => (
                        <div key={index} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-gray-200/60 transition-shadow duration-300 flex flex-col text-left animate-slide-in-up" style={{ animationDelay: `${index * 150}ms`}}>
                            {benefit.icon}
                            <h3 className="text-2xl font-bold mt-1 mb-3 text-brand-text">{benefit.title}</h3>
                            <p className="text-brand-text-light">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyGLP1;