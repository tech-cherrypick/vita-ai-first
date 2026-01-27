
import React from 'react';
import { faqItems } from '../constants';

const Faq: React.FC = () => {
    return (
        <section className="py-20 sm:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-brand-text text-center mb-10">
                        Common Questions About Safety
                    </h2>
                    <div className="space-y-8">
                        {faqItems.map((item, index) => (
                            <div key={index} className="border-b border-gray-200/80 pb-6 last:border-b-0 last:pb-0">
                                <h3 className="text-lg font-bold flex items-start gap-3 text-brand-text">
                                    <span>🤔</span>
                                    {item.question}
                                </h3>
                                <p className="mt-2 text-brand-text-light pl-8">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Faq;