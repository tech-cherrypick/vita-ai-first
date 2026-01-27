
import React from 'react';

const Stats: React.FC = () => {
    return (
        <section className="py-24 sm:py-32 bg-gradient-to-r from-brand-pink via-brand-purple to-brand-cyan text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter drop-shadow-lg">20%</h2>
                <p className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight">Average Body Weight Loss</p>
                <p className="max-w-3xl mx-auto mt-6 text-lg text-purple-100/90">
                    That's not a typo. Clinically proven GLP-1 medications can help you lose up to 20% of your body weight when combined with our personalized care plan.
                </p>
            </div>
        </section>
    );
};

export default Stats;