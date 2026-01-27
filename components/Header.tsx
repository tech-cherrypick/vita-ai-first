
import React from 'react';
import { VitaLogo } from '../constants';

interface HeaderProps {
    onDoctorLogin: () => void;
    onPatientLogin: () => void;
    onCaregiverLogin: () => void;
}

const Header: React.FC<HeaderProps> = ({ onDoctorLogin, onPatientLogin, onCaregiverLogin }) => {

    return (
        <header className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-lg">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 gap-4">
                    <div className="flex-shrink-0">
                        <VitaLogo />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mr-4 pr-4 sm:mr-0 sm:pr-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                         <button 
                            onClick={onPatientLogin}
                            className="flex-shrink-0 inline-block px-4 py-2 text-xs sm:text-sm font-semibold text-brand-text bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors duration-300 whitespace-nowrap"
                        >
                            Patient
                        </button>
                        <button 
                            onClick={onCaregiverLogin}
                            className="flex-shrink-0 inline-block px-4 py-2 text-xs sm:text-sm font-semibold text-brand-cyan rounded-full hover:bg-brand-cyan/10 transition-colors duration-300 whitespace-nowrap"
                        >
                            Care Manager
                        </button>
                         <button 
                            onClick={onDoctorLogin}
                            className="flex-shrink-0 inline-block px-4 py-2 text-xs sm:text-sm font-semibold text-brand-purple rounded-full hover:bg-brand-purple/10 transition-colors duration-300 whitespace-nowrap"
                        >
                            Doctor
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
