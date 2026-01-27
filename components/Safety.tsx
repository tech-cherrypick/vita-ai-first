
import React from 'react';
import { safetyFeatures } from '../constants';

const Safety: React.FC = () => {
    return (
        <section className="py-20 sm:py-28 bg-brand-bg">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-block bg-green-100 text-green-800 text-sm font-bold px-4 py-2 rounded-full mb-4">
                        ✓ FDA APPROVED & CLINICALLY PROVEN
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-brand-text">
                        Safe, Effective, <span className="bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent">Trusted</span>
                    </h2>
                    <p className="mt-4 text-lg text-brand-text-light max-w-2xl mx-auto">
                        Real science. Real doctors. Real peace of mind. 🧘‍♀️
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {safetyFeatures.map((feature, index) => (
                        <div key={index} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/30 hover:shadow-xl transition-shadow duration-300">
                           {feature.icon}
                            <h3 className="text-xl font-bold mb-2 text-brand-text">{feature.title}</h3>
                            <p className="text-brand-text-light">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Safety;