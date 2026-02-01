
import React from 'react';
import { VitaLogo } from '../../constants';

interface UserHeaderProps {
    onOpenMenu: () => void;
    onGoHome: () => void;
    userName: string;
}

const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


const UserHeader: React.FC<UserHeaderProps> = ({ onOpenMenu, onGoHome, userName }) => {
    return (
        <header className="bg-brand-bg/80 backdrop-blur-lg sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 border-b border-gray-200">
                    <button onClick={onGoHome} aria-label="Go to dashboard">
                        <VitaLogo />
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline-block text-sm font-semibold text-gray-700">
                            Hi, {userName}
                        </span>
                        <button
                            onClick={onOpenMenu}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                            aria-label="Open menu"
                        >
                            <HamburgerIcon />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default UserHeader;