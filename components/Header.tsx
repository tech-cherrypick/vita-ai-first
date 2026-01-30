
import React from 'react';
import { VitaLogo } from '../constants';

interface HeaderProps {
    onLogin: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogin }) => {

    return (
        <header className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-lg">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 gap-4">
                    <div className="flex-shrink-0">
                        <VitaLogo />
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={onLogin}
                            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-brand-purple rounded-full hover:bg-brand-purple/90 transition-all duration-300 shadow-lg shadow-brand-purple/20 active:scale-95"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
