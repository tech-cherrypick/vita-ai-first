
import React, { useState, useMemo } from 'react';
import { ArrowRightIcon } from '../../constants';

interface ConsultationSchedulerProps {
    onSchedule: (dateTime: { date: Date; time: string }) => void;
    minBookingNoticeDays?: number;
    minDate?: Date;
    isButtonDisabled?: boolean;
    buttonText?: string;
}

const GradientButton: React.FC<{ children: React.ReactNode, onClick?: () => void, type?: "button" | "submit", className?: string, disabled?: boolean }> = ({ children, onClick, type="button", className="", disabled=false }) => (
    <button 
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan bg-[length:200%_auto] rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-purple/20 animate-gradient-x ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {children}
    </button>
);

const ConsultationScheduler: React.FC<ConsultationSchedulerProps> = ({ onSchedule, minBookingNoticeDays = 0, minDate, isButtonDisabled = false, buttonText = "Confirm Appointment" }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 9; i <= 17; i++) { // 9 AM to 5 PM
            for (let j = 0; j < 60; j += 30) {
                if (i === 17 && j > 0) continue; // Stop at 5:00 PM
                const hour = i;
                const minute = j;
                const period = hour >= 12 ? 'PM' : 'AM';
                let displayHour = hour % 12;
                if (displayHour === 0) displayHour = 12; // Handle noon
                const displayMinute = minute < 10 ? `0${minute}` : minute;
                slots.push(`${displayHour}:${displayMinute} ${period}`);
            }
        }
        return slots;
    }, []);

    const calendarDays = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days: (Date | null)[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentMonthDate]);

    const changeMonth = (amount: number) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };
    
    const isUnavailable = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 1. Check basic booking notice
        const minBookingDate = new Date(today);
        minBookingDate.setDate(today.getDate() + minBookingNoticeDays);
        if (date < minBookingDate) return true;

        // 2. Check strict minDate (e.g. Labs + 5 days)
        if (minDate) {
            const strictMin = new Date(minDate);
            strictMin.setHours(0,0,0,0);
            if (date < strictMin) return true;
        }

        return false;
    };


    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            onSchedule({ date: selectedDate, time: selectedTime });
        }
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-semibold text-brand-text text-center">Select a date and time.</label>
            {minDate && (
                <p className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    Note: Appointments must be at least 5 days after your lab test ({minDate.toLocaleDateString()}) to ensure results are ready.
                </p>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200" aria-label="Previous month">&lt;</button>
                    <div className="font-semibold">{currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                    <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200" aria-label="Next month">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day} className="font-semibold text-gray-500">{day}</div>)}
                    {calendarDays.map((day, index) => (
                        <div key={index} className="flex items-center justify-center">
                             {day ? (
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedDate(day)}
                                    disabled={isUnavailable(day)}
                                    className={`w-8 h-8 rounded-full transition-colors ${selectedDate?.toDateString() === day.toDateString() ? 'bg-brand-purple text-white' : 'hover:bg-gray-200'} ${isUnavailable(day) ? 'text-gray-300 cursor-not-allowed' : ''}`}
                                >
                                    {day.getDate()}
                                </button>
                            ) : (
                                <div className="w-8 h-8"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            {selectedDate && (
                <div className="grid grid-cols-3 gap-2 animate-fade-in">
                    {timeSlots.map(time => (
                        <button 
                            type="button" 
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`p-2 rounded-lg text-sm border transition-colors ${selectedTime === time ? 'bg-brand-purple text-white border-brand-purple' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                        >
                            {time}
                        </button>
                    ))}
                </div>
            )}

            <GradientButton onClick={handleConfirm} disabled={isButtonDisabled || !selectedDate || !selectedTime}>
                {buttonText} <ArrowRightIcon/>
            </GradientButton>
        </div>
    );
};

export default ConsultationScheduler;
