
import React from 'react';
import { VitaLogo } from '../constants';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-brand-text-light">
                <div className="flex justify-center mb-6">
                     <VitaLogo />
                </div>
                <p className="text-sm">&copy; {new Date().getFullYear()} Vita Health Inc. All rights reserved.</p>
                 <p className="text-xs mt-2 max-w-xl mx-auto">This information is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
            </div>
        </footer>
    );
};

export default Footer;