
import React from 'react';
import { ArrowRightIcon } from '../constants';

const CallToAction: React.FC = () => {
     const handleQuizClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const quizElement = document.getElementById('eligibility-quiz');
        if (quizElement) {
            quizElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <section className="py-20 sm:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan p-12 sm:p-16 rounded-3xl">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">Ready to Start Your Journey?</h2>
                    <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
                        Join thousands who are already transforming their lives. Your glow up is literally one click away.
                    </p>
                    <div className="mt-10 flex justify-center">
                         <a href="#eligibility-quiz"
                            onClick={handleQuizClick}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-brand-text bg-white rounded-full shadow-lg hover:scale-105 transition-transform duration-300">
                            Let's Go! 🚀
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
