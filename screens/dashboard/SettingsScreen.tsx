
import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/NotificationService';

const SettingsScreen: React.FC = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await notificationService.getSettings();
                setNotificationsEnabled(settings.enabled);
            } catch {
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = async () => {
        setIsSaving(true);
        const newValue = !notificationsEnabled;
        try {
            let success: boolean;
            if (newValue) {
                success = await notificationService.enableNotifications();
            } else {
                success = await notificationService.disableNotifications();
            }
            if (success) {
                setNotificationsEnabled(newValue);
            }
        } catch {
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
                <p className="mt-1 text-gray-600">Manage your app preferences.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Notifications</h2>

                    <div className="flex items-center justify-between py-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Push Notifications</p>
                                <p className="text-sm text-gray-500">Receive alerts for messages, updates and reminders</p>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="w-12 h-7 bg-gray-200 rounded-full animate-pulse" />
                        ) : (
                            <button
                                onClick={handleToggle}
                                disabled={isSaving}
                                className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 ${notificationsEnabled ? 'bg-brand-purple' : 'bg-gray-300'} ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;

