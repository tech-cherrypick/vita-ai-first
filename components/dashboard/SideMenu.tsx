
import React, { useEffect } from 'react';
import { VitaLogo, sideMenuItems, MenuSignOutIcon } from '../../constants';
import { DashboardView } from '../../screens/UserDashboard';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSignOut: () => void;
    onNavigate: (view: DashboardView) => void;
    currentView: DashboardView;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onSignOut, onNavigate, currentView }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    return (
        <div 
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!isOpen}
        >
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            ></div>

            {/* Menu Panel */}
            <div 
                className={`fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="menu-heading"
            >
                <div className="flex flex-col h-full">
                    <header className="flex items-center justify-between p-4 border-b">
                        <VitaLogo />
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </header>
                    
                    <nav className="flex-1 p-4 space-y-2">
                        {sideMenuItems.map(item => {
                            const isActive = currentView === item.id;
                            return (
                                <button 
                                    key={item.name} 
                                    onClick={() => onNavigate(item.id as DashboardView)}
                                    className={`w-full flex items-center gap-4 p-3 rounded-lg text-left font-semibold transition-colors ${isActive ? 'bg-brand-purple/10 text-brand-purple' : 'text-brand-text hover:bg-gray-100'}`}
                                >
                                    <span className={isActive ? 'text-brand-purple' : 'text-gray-500'}>{item.icon}</span>
                                    {item.name}
                                </button>
                            )
                        })}
                    </nav>

                    <footer className="p-4 border-t">
                         <button 
                            onClick={onSignOut}
                            className="w-full flex items-center gap-4 p-3 rounded-lg text-brand-text font-semibold hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                             <span className="text-red-500"><MenuSignOutIcon /></span>
                            Sign Out
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default SideMenu;
