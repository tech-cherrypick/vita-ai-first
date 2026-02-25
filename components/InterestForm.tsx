
import React, { useState } from 'react';
import { ArrowRightIcon } from '../constants';

const InterestForm: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE_URL}/api/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                console.error('Failed to submit form');
                alert('Something went wrong. Please try again later.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error connecting to server. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <section id="interest-form" className="py-20 bg-brand-bg">
                <div className="container mx-auto px-4 max-w-xl">
                    <div className="bg-white p-10 rounded-[32px] shadow-xl border border-green-100 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">You're on the list!</h2>
                        <p className="text-gray-600 mb-8 text-lg">Thanks for your interest. A Vita care specialist will contact you shortly to discuss your eligibility.</p>
                        <button
                            onClick={() => {
                                setSubmitted(false);
                                setFormData({ name: '', phone: '', email: '' });
                            }}
                            className="text-brand-purple font-bold hover:underline text-sm"
                        >
                            Register another person
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="interest-form" className="py-20 bg-gradient-to-b from-brand-bg to-white relative">
            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">

                    {/* Left Side: Marketing Copy */}
                    <div className="md:w-2/5 bg-gray-900 p-10 sm:p-12 text-white flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 opacity-30"></div>

                        <div className="relative z-10">
                            <div className="inline-block px-3 py-1 bg-brand-cyan/20 rounded-full text-brand-cyan text-xs font-bold uppercase tracking-wider mb-6">
                                Limited Availability
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-extrabold mb-6 leading-tight">
                                Start Your <br />Transformation
                            </h3>
                            <p className="text-gray-400 mb-10 text-lg leading-relaxed">
                                Join the Vita program designed specifically for the Indian metabolic profile.
                            </p>

                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-base font-medium">Doctor-led Protocol</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-base font-medium">Metabolic Reset</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-base font-medium">No-Cost Consultation</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Custom Form */}
                    <div className="md:w-3/5 p-10 sm:p-12 relative">
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">Request a Callback</h4>
                        <p className="text-gray-500 mb-8">Enter your details below to check eligibility.</p>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="name">Full Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    id="name"
                                    type="text"
                                    placeholder="Enter your name"
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="phone">Phone Number</label>
                                <input
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    id="phone"
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="email">Email Address</label>
                                <input
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-4 bg-brand-text text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    'Submitting...'
                                ) : (
                                    <>
                                        Get Started <ArrowRightIcon />
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-400 mt-6">
                                By submitting, you agree to receive communication from Vita Health regarding your inquiry. Your data is secure.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InterestForm;