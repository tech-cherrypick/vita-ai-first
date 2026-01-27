
import React, { useState, useEffect } from 'react';
import { ArrowRightIcon } from '../constants';

const heroImages = [
    'https://images.pexels.com/photos/4348631/pexels-photo-4348631.jpeg', // Yoga
    'https://images.pexels.com/photos/8391700/pexels-photo-8391700.jpeg',  // Woman working out
    'https://images.pexels.com/photos/7991922/pexels-photo-7991922.jpeg' // Man with battle ropes
];

const Hero: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleQuizClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const quizElement = document.getElementById('eligibility-quiz');
        if (quizElement) {
            quizElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <section className="relative h-[90vh] min-h-[600px] max-h-[800px] flex items-center justify-center text-center text-white overflow-hidden">
            {heroImages.map((src, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                    style={{ zIndex: index === currentSlide ? 1 : 0 }}
                >
                    <img
                        className="w-full h-full object-cover object-center"
                        src={src}
                        alt={`Person happy with their weight loss journey`}
                    />
                    {/* Reduced opacity from 50% to 30% to make images brighter */}
                    <div className="absolute inset-0 bg-black/30"></div>
                </div>
            ))}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 animate-fade-in">
                <div className="max-w-3xl mx-auto">
                    {/* Increased drop shadow for better contrast against brighter background */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter leading-tight text-white drop-shadow-2xl">
                        Weight Loss <br />
                        <span className="text-brand-cyan drop-shadow-lg">Starts Here</span>
                    </h1>
                    <p className="mt-6 text-lg text-white font-medium max-w-xl mx-auto drop-shadow-xl">
                        Reset your metabolic health with effective results. Real doctors, real science, zero awkward office visits.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <a href="#eligibility-quiz"
                            onClick={handleQuizClick}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-brand-text bg-white rounded-full shadow-lg hover:scale-105 transition-transform duration-300">
                            Check My Eligibility 🤸&nbsp;&nbsp;&nbsp;
                            <ArrowRightIcon />
                        </a>
                    </div>
                     <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white font-semibold drop-shadow-lg">
                        <span>✓ Up to 20% weight loss</span>
                        <span>✓ Results in weeks</span>
                        <span>✓ Doctor supervised</span>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {heroImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};
export default Hero;
