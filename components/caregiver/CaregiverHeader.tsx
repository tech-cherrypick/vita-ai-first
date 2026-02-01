

import React, { useState } from 'react';
import { VitaLogo } from '../../constants';
import { CareCoordinatorView } from '../../screens/CaregiverDashboard';

interface CareCoordinatorHeaderProps {
    onSignOut: () => void;
    currentView: CareCoordinatorView;
    setView: (view: CareCoordinatorView) => void;
    userName: string;
}

const NavLink: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}> = ({ isActive, onClick, children, className = "" }) => {
    const activeClasses = "text-brand-cyan border-b-2 border-brand-cyan pb-1";
    const inactiveClasses = "text-gray-600 hover:text-brand-cyan transition-colors";
    const mobileActiveClasses = "bg-brand-cyan/10 text-brand-cyan";
    const mobileInactiveClasses = "text-gray-700 hover:bg-gray-100";


    if (className.includes('mobile-nav-link')) {
        return (
            <button
                onClick={onClick}
                className={`${className} w-full text-left font-semibold p-3 rounded-lg transition-colors ${isActive ? mobileActiveClasses : mobileInactiveClasses}`}
            >
                {children}
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`text-sm font-semibold ${isActive ? activeClasses : inactiveClasses}`}
        >
            {children}
        </button>
    );
};

const CareCoordinatorHeader: React.FC<CareCoordinatorHeaderProps> = ({ onSignOut, currentView, setView, userName }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavClick = (view: CareCoordinatorView) => {
        setView(view);
        setIsMenuOpen(false);
    };

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-8">
                        <VitaLogo />
                        <nav className="hidden md:flex gap-6">
                            <NavLink isActive={currentView === 'triage'} onClick={() => handleNavClick('triage')}>
                                Triage Queue
                            </NavLink>
                            <NavLink isActive={currentView === 'schedule'} onClick={() => handleNavClick('schedule')}>
                                Schedule
                            </NavLink>
                            <NavLink isActive={currentView === 'messages'} onClick={() => handleNavClick('messages')}>
                                Messages
                            </NavLink>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-800">{userName}</p>
                            <p className="text-xs text-gray-500">Care Coordinator</p>
                        </div>
                        <button
                            onClick={onSignOut}
                            className="hidden sm:inline-block px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            Sign Out
                        </button>
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md hover:bg-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
                {isMenuOpen && (
                    <nav className="md:hidden py-4 border-t border-gray-200 space-y-1">
                        <NavLink className="mobile-nav-link" isActive={currentView === 'triage'} onClick={() => handleNavClick('triage')}>Triage Queue</NavLink>
                        <NavLink className="mobile-nav-link" isActive={currentView === 'schedule'} onClick={() => handleNavClick('schedule')}>Schedule</NavLink>
                        <NavLink className="mobile-nav-link" isActive={currentView === 'messages'} onClick={() => handleNavClick('messages')}>Messages</NavLink>
                        <div className="pt-2">
                            <button
                                onClick={onSignOut}
                                className="w-full text-left font-semibold p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
};

export default CareCoordinatorHeader;