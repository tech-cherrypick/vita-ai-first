import React, { useState } from 'react';
import { patientFaqItems } from '../../constants';

const ScreenHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold tracking-tighter text-brand-text">{title}</h2>
        <p className="mt-2 text-lg text-brand-text-light max-w-2xl mx-auto">{subtitle}</p>
    </div>
);

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-4"
            >
                <h3 className="font-semibold text-brand-text">{question}</h3>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <p className="pb-4 text-brand-text-light">{answer}</p>
            </div>
        </div>
    );
};


const HelpScreen: React.FC = () => {
    return (
        <div>
            <ScreenHeader title="Help & FAQ" subtitle="Find answers to common questions about your treatment." />
            
            <div className="max-w-3xl mx-auto space-y-10">
                {patientFaqItems.map(category => (
                    <div key={category.category}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-brand-purple">{category.icon}</span>
                            <h2 className="text-2xl font-bold text-brand-text">{category.category}</h2>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-2">
                            {category.faqs.map((faq, index) => (
                                <FaqItem key={index} question={faq.question} answer={faq.answer} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HelpScreen;
