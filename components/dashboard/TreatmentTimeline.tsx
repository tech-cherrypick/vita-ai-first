
import React, { useState, useMemo } from 'react';
import ConsultationScheduler from './ConsultationScheduler';
import { Patient, WorkoutRoutine, DailyLog, TimelineEvent } from '../../constants';

interface TreatmentTimelineProps {
    patient?: Patient;
    onUpdatePatient?: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates?: Partial<Patient>) => void;
}

interface WeekLogProps {
    weekNumber: number;
    isActive: boolean;
    isCompleted: boolean;
    onToggle: () => void;
    isLastWeek: boolean;
    onScheduleFollowUp: () => void;
    onSave?: (data: { weight: number, sideEffects: string, notes: string }) => void;
}

const GradientButton: React.FC<{ children: React.ReactNode, onClick?: () => void, className?: string, disabled?: boolean }> = ({ children, onClick, className = "", disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan bg-[length:200%_auto] rounded-lg transition-all duration-300 hover:scale-105 shadow-md shadow-brand-purple/20 animate-gradient-x ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {children}
    </button>
);

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const ConfirmationCheckIcon = () => (
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
    </div>
);

// --- Workout Detail Modal ---

const WorkoutModal: React.FC<{ routine: WorkoutRoutine; onClose: () => void }> = ({ routine, onClose }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-md max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col animate-slide-in-up">

                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-brand-purple/5 to-brand-cyan/5 border-b border-gray-100">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <CloseIcon />
                    </button>
                    <h3 className="text-sm font-bold text-brand-purple uppercase tracking-wider mb-1">MuscleProtect Protocol</h3>
                    <h2 className="text-2xl font-extrabold text-gray-900">{routine.title}</h2>
                    <p className="text-gray-600 mt-2 text-sm">{routine.description}</p>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="flex items-center gap-1 text-xs font-semibold bg-gray-100 px-3 py-1 rounded-full">
                            ⏱️ {routine.durationMin} mins
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold bg-gray-100 px-3 py-1 rounded-full">
                            💪 {routine.exercises.length} Exercises
                        </span>
                    </div>
                </div>

                {/* Exercise List */}
                <div className="overflow-y-auto p-6 space-y-6">
                    {routine.exercises.map((exercise, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-text text-white flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                            </div>
                            <div className="flex-1 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                                <h4 className="text-lg font-bold text-gray-900">{exercise.name}</h4>
                                <div className="flex gap-4 mt-2 mb-3">
                                    <div className="text-sm">
                                        <span className="block text-xs font-semibold text-gray-400 uppercase">Sets</span>
                                        <span className="font-bold text-gray-800">{exercise.sets}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="block text-xs font-semibold text-gray-400 uppercase">Reps</span>
                                        <span className="font-bold text-gray-800">{exercise.reps}</span>
                                    </div>
                                </div>
                                {exercise.note && (
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 italic">
                                        💡 Coach Tip: {exercise.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button onClick={onClose} className="w-full py-3 bg-brand-text text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                        Close Workout
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Daily Tracker Sub-Components ---

const CoachInsightBanner: React.FC<{ insight: string; completedTasks: number; totalTasks: number }> = ({ insight, completedTasks, totalTasks }) => {
    const isGoodDay = totalTasks > 0 && completedTasks / totalTasks > 0.5;

    return (
        <div className="bg-gradient-to-r from-brand-purple/5 to-brand-cyan/5 border border-brand-purple/20 p-4 rounded-xl flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-xl">
                {isGoodDay ? '🌟' : '💡'}
            </div>
            <div>
                <p className="text-xs font-bold text-brand-purple uppercase tracking-wider">Coach Insight</p>
                <p className="text-sm font-medium text-gray-800">{insight}</p>
            </div>
        </div>
    );
};

const InputCard: React.FC<{
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}> = ({ title, subtitle, icon, children, className = "" }) => (
    <div className={`p-3 rounded-lg border border-gray-100 bg-white hover:shadow-sm transition-all duration-200 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-brand-purple/5 text-brand-purple">
                {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{title}</h4>
                {subtitle && <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>}
            </div>
        </div>
        <div className="pl-0">
            {children}
        </div>
    </div>
);

const MealInput: React.FC<{
    title: string;
    meal?: { time: string; description: string; photoUrl?: string };
    onChange: (meal: { time: string; description: string; photoUrl?: string }) => void;
}> = ({ title, meal, onChange }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange({ ...meal, time: meal?.time || '', description: meal?.description || '', photoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-3 rounded-lg border border-gray-100 bg-white hover:shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-brand-purple/5 text-brand-purple">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
                </div>
                <input
                    type="time"
                    value={meal?.time || ''}
                    onChange={(e) => onChange({ ...meal, time: e.target.value, description: meal?.description || '', photoUrl: meal?.photoUrl })}
                    className="p-0.5 text-xs bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-brand-purple outline-none"
                />
            </div>

            <div className="space-y-2">
                <textarea
                    rows={1}
                    placeholder={`Details...`}
                    value={meal?.description || ''}
                    onChange={(e) => onChange({ ...meal, time: meal?.time || '', description: e.target.value, photoUrl: meal?.photoUrl })}
                    className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-purple/20 focus:border-brand-purple outline-none transition-all resize-none text-xs"
                />

                <div className="flex items-center justify-between">
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-brand-purple bg-brand-purple/5 rounded hover:bg-brand-purple/10 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {meal?.photoUrl ? 'Change' : 'Photo'}
                    </button>
                    {meal?.photoUrl && (
                        <span className="text-[10px] text-green-600 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Attached
                        </span>
                    )}
                </div>

                {meal?.photoUrl && (
                    <div className="relative w-full h-20 rounded-md overflow-hidden border border-gray-100">
                        <img src={meal.photoUrl} alt={`${title} meal`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <button
                            onClick={() => onChange({ ...meal, time: meal?.time || '', description: meal?.description || '', photoUrl: undefined })}
                            className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const getDailyInsight = (patient: Patient, date: Date): string => {
    // Simple deterministic random generator based on date
    const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear() * 366;
    const name = patient.name.split(' ')[0];

    const insights = [
        `Consistency is key, ${name}. Tracking your sleep and meals helps us optimize your plan.`,
        `"The only bad workout is the one that didn't happen." Even a 10-minute walk counts!`,
        `Be patient with your body. Sustainable metabolic change takes time.`,
        `Great job logging your data! This helps your care team make better decisions.`,
        `Did you know? Consistent sleep schedules regulate hunger hormones.`,
        `Stress raises cortisol, which can stall weight loss. Breathwork is a powerful tool.`,
        `Eating slowly allows your body to signal fullness effectively.`,
    ];

    return insights[seed % insights.length];
};

const DailyTracker: React.FC<{ patient: Patient; onUpdatePatient?: (id: string | number, e: null, u: Partial<Patient>) => void }> = ({ patient, onUpdatePatient }) => {
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);

    // Date Strip Logic
    const dates = useMemo(() => {
        const days = [];
        for (let i = -3; i <= 3; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            days.push(d);
        }
        return days;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Helper to generate a unique key for each day
    const getDateKey = (date: Date) => {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    };

    const dateKey = getDateKey(selectedDate);

    // Get current day's data from patient object or default values
    const activeLog: DailyLog = patient.dailyLogs?.[dateKey] || {
        medicationTaken: false,
        proteinIntake: 0,
        waterIntake: 0,
        mindsetCompleted: [],
        fitnessCompleted: false,
        bedTimePreviousDay: '',
        wakeUpTime: '',
        weight: undefined,
        steps: undefined,
        exercise: '',
        eatenOutside: '',
        nutriPackEaten: '',
        mealTimes: '',
        meditation: false
    };

    const updateLog = (key: keyof DailyLog, value: any) => {
        if (!onUpdatePatient) return;

        const newLog = { ...activeLog, [key]: value };
        const updatedDailyLogs = {
            ...patient.dailyLogs,
            [dateKey]: newLog
        };

        // Persist to parent/database without creating a timeline event (null event)
        onUpdatePatient(patient.id, null, { dailyLogs: updatedDailyLogs });
    };

    const carePlan = patient.carePlan || {
        medicationSchedule: { dayOfWeek: 2, timeOfDay: 'Morning' },
        nutrition: { proteinGrams: 120, waterLitres: 2.5 },
        fitness: { weeklyGoal: 3, type: 'Movement' },
        mindbody: ['Meditation']
    };

    // Determine the workout for today/general routine
    const workoutRoutine = carePlan.fitness.protocol?.routines[0];

    const dailyInsight = useMemo(() => getDailyInsight(patient, selectedDate), [patient, selectedDate]);

    // Calculate completion for coach insight icon state
    const totalFields = 9;
    let completedCount = 0;
    if (activeLog.bedTimePreviousDay) completedCount++;
    if (activeLog.wakeUpTime) completedCount++;
    if (activeLog.weight) completedCount++;
    if (activeLog.steps) completedCount++;
    if (activeLog.exercise) completedCount++;
    if (activeLog.eatenOutside) completedCount++;
    if (activeLog.nutriPackEaten) completedCount++;
    if (activeLog.mealTimes) completedCount++;
    if (activeLog.meditation) completedCount++;

    return (
        <div className="animate-fade-in pb-20">
            {/* Calendar Strip */}
            <div className="flex justify-between items-center mb-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
                {dates.map((date, idx) => {
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === today.toDateString();
                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(date)}
                            className={`flex flex-col items-center justify-center w-10 h-12 rounded-lg transition-all min-w-[2.5rem] ${isSelected ? 'bg-brand-text text-white shadow-md scale-105' : 'hover:bg-gray-50 text-gray-500'}`}
                        >
                            <span className="text-[9px] uppercase font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className={`text-base font-bold ${isSelected ? 'text-white' : isToday ? 'text-brand-purple' : 'text-gray-800'}`}>{date.getDate()}</span>
                        </button>
                    )
                })}
            </div>

            {/* Compact Grid Layout */}
            <div className="grid grid-cols-2 gap-3">

                {/* 1. Sleep & Recovery */}
                <div className="col-span-2 space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Sleep & Recovery</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <InputCard
                            title="Bed Time"
                            subtitle="Previous Day"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                        >
                            <input
                                type="time"
                                value={activeLog.bedTimePreviousDay || ''}
                                onChange={(e) => updateLog('bedTimePreviousDay', e.target.value)}
                                className="w-full p-1 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-brand-purple outline-none text-sm"
                            />
                        </InputCard>
                        <InputCard
                            title="Wake Up"
                            subtitle="Today"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        >
                            <input
                                type="time"
                                value={activeLog.wakeUpTime || ''}
                                onChange={(e) => updateLog('wakeUpTime', e.target.value)}
                                className="w-full p-1 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-brand-purple outline-none text-sm"
                            />
                        </InputCard>
                    </div>
                </div>

                {/* 2. Body Metrics */}
                <div className="col-span-2 space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Body Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <InputCard
                            title="Weight"
                            subtitle="kg"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                        >
                            <input
                                type="number"
                                placeholder="0.0"
                                value={activeLog.weight || ''}
                                onChange={(e) => updateLog('weight', parseFloat(e.target.value))}
                                className="w-full p-1 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-brand-purple outline-none text-sm"
                            />
                        </InputCard>
                        <InputCard
                            title="Steps"
                            subtitle="Count"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        >
                            <input
                                type="number"
                                placeholder="0"
                                value={activeLog.steps || ''}
                                onChange={(e) => updateLog('steps', parseInt(e.target.value))}
                                className="w-full p-1 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-brand-purple outline-none text-sm"
                            />
                        </InputCard>
                    </div>
                </div>

                {/* 3. Activity & Medication */}
                <div className="col-span-2 space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Activity & Meds</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <InputCard
                            title="Exercise"
                            subtitle="Details"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            className="col-span-2"
                        >
                            <textarea
                                rows={1}
                                placeholder="e.g., 30 min brisk walk..."
                                value={activeLog.exercise || ''}
                                onChange={(e) => updateLog('exercise', e.target.value)}
                                className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-purple/20 focus:border-brand-purple outline-none transition-all resize-none mb-1 text-sm"
                            />
                            {workoutRoutine && (
                                <button
                                    onClick={() => setIsWorkoutModalOpen(true)}
                                    className="text-[10px] font-bold text-brand-purple hover:underline flex items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    View Routine
                                </button>
                            )}
                        </InputCard>

                        <InputCard
                            title="Medication"
                            subtitle="Taken?"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                        >
                            <button
                                onClick={() => updateLog('medicationTaken', !activeLog.medicationTaken)}
                                className={`w-full py-1.5 rounded text-xs font-bold transition-all ${activeLog.medicationTaken ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {activeLog.medicationTaken ? 'Taken' : 'Mark Taken'}
                            </button>
                        </InputCard>

                        <InputCard
                            title="Mindset"
                            subtitle="Done?"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        >
                            <button
                                onClick={() => updateLog('meditation', !activeLog.meditation)}
                                className={`w-full py-1.5 rounded text-xs font-bold transition-all ${activeLog.meditation ? 'bg-brand-purple/20 text-brand-purple' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {activeLog.meditation ? 'Done' : 'Mark Done'}
                            </button>
                        </InputCard>
                    </div>
                </div>

                {/* 4. Nutrition */}
                <div className="col-span-2 space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nutrition</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <MealInput
                            title="Breakfast"
                            meal={activeLog.breakfast}
                            onChange={(meal) => updateLog('breakfast', meal)}
                        />
                        <MealInput
                            title="Lunch"
                            meal={activeLog.lunch}
                            onChange={(meal) => updateLog('lunch', meal)}
                        />
                        <MealInput
                            title="Dinner"
                            meal={activeLog.dinner}
                            onChange={(meal) => updateLog('dinner', meal)}
                        />
                        <MealInput
                            title="Snacks"
                            meal={activeLog.snacks}
                            onChange={(meal) => updateLog('snacks', meal)}
                        />
                    </div>

                    <div className="mt-2">
                        <InputCard
                            title="Outside Food"
                            subtitle="Details"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                        >
                            <textarea
                                rows={1}
                                placeholder="e.g., Slice of cake..."
                                value={activeLog.eatenOutside || ''}
                                onChange={(e) => updateLog('eatenOutside', e.target.value)}
                                className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-purple/20 focus:border-brand-purple outline-none transition-all resize-none text-sm mb-2"
                            />

                            <div className="flex flex-wrap gap-2">
                                {activeLog.eatenOutsidePhotos?.map((photo, idx) => (
                                    <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-100 group">
                                        <img src={photo} alt={`Outside food ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => {
                                                const newPhotos = activeLog.eatenOutsidePhotos?.filter((_, i) => i !== idx);
                                                updateLog('eatenOutsidePhotos', newPhotos);
                                            }}
                                            className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}

                                <label className="flex items-center justify-center w-16 h-16 rounded-md border-2 border-dashed border-gray-200 hover:border-brand-purple/50 bg-gray-50 cursor-pointer transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            files.forEach(file => {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    const newPhotos = [...(activeLog.eatenOutsidePhotos || []), reader.result as string];
                                                    updateLog('eatenOutsidePhotos', newPhotos);
                                                };
                                                reader.readAsDataURL(file);
                                            });
                                        }}
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </label>
                            </div>
                        </InputCard>
                    </div>
                </div>
            </div>

            {/* Workout Detail Modal */}
            {isWorkoutModalOpen && workoutRoutine && (
                <WorkoutModal routine={workoutRoutine} onClose={() => setIsWorkoutModalOpen(false)} />
            )}
        </div>
    );
}


// --- Weekly Progress Sub-Components ---

const WeekLog: React.FC<WeekLogProps> = ({ weekNumber, isActive, isCompleted, onToggle, isLastWeek, onScheduleFollowUp, onSave }) => {
    const [weight, setWeight] = useState<string>('');
    const [sideEffects, setSideEffects] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const handleSave = () => {
        if (onSave) {
            onSave({
                weight: parseFloat(weight) || 0,
                sideEffects,
                notes
            });
        }
    };

    return (
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={onToggle} className="w-full flex justify-between items-center p-4 text-left">
                <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-brand-purple text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {isCompleted ? '✓' : weekNumber}
                    </div>
                    <div>
                        <h4 className="font-bold text-brand-text">Week {weekNumber}</h4>
                        <p className="text-sm text-brand-text-light">{isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Upcoming'}</p>
                    </div>
                </div>
                <span className={`transform transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isActive && (
                <div className="p-6 border-t border-gray-200 animate-fade-in">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor={`weight-${weekNumber}`} className="block text-sm font-semibold text-brand-text mb-1">Log Your Weight (kg)</label>
                            <input
                                type="number"
                                id={`weight-${weekNumber}`}
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                                placeholder="e.g., 80"
                            />
                        </div>
                        <div>
                            <label htmlFor={`side-effects-${weekNumber}`} className="block text-sm font-semibold text-brand-text mb-1">Any Side Effects?</label>
                            <textarea
                                id={`side-effects-${weekNumber}`}
                                rows={2}
                                value={sideEffects}
                                onChange={(e) => setSideEffects(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                                placeholder="e.g., Mild nausea for a day after injection."
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor={`notes-${weekNumber}`} className="block text-sm font-semibold text-brand-text mb-1">Notes for Your Doctor</label>
                            <textarea
                                id={`notes-${weekNumber}`}
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                                placeholder="e.g., Feeling great this week, cravings are much lower."
                            ></textarea>
                        </div>
                        <button
                            onClick={handleSave}
                            className="w-full px-4 py-2 font-semibold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition-colors"
                        >
                            Save Log
                        </button>
                    </div>
                    {isLastWeek && (
                        <div className="mt-6 p-4 bg-white rounded-lg border border-brand-purple/30 text-center">
                            <h5 className="font-bold text-brand-text">Ready for your next month?</h5>
                            <p className="text-sm text-brand-text-light my-2">Schedule your follow-up consultation to review progress and receive your next month's medication.</p>
                            <GradientButton onClick={onScheduleFollowUp}>
                                Schedule Follow-up
                            </GradientButton>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface Cycle {
    id: number;
    month: string;
}

// --- Main Treatment Timeline Component ---

const TreatmentTimeline: React.FC<TreatmentTimelineProps> = ({ patient, onUpdatePatient }) => {
    const [view, setView] = useState<'daily' | 'weekly'>('daily');
    const [activeWeek, setActiveWeek] = useState(1);
    const [cycles, setCycles] = useState<Cycle[]>([{ id: 1, month: 'June 2024' }]);
    const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
    const [followUpConfirmed, setFollowUpConfirmed] = useState<string | null>(null);

    const handleToggleWeek = (week: number) => {
        setActiveWeek(activeWeek === week ? 0 : week);
    };

    const handleScheduleFollowUpClick = () => {
        setIsSchedulingFollowUp(true);
    };

    const handleFollowUpScheduled = (dateTime: { date: Date; time: string }) => {
        const formattedDate = dateTime.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const formattedDateTime = `${dateTime.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${dateTime.time}`;
        setFollowUpConfirmed(formattedDateTime);

        if (onUpdatePatient) {
            const followUpEvent: Omit<TimelineEvent, 'id' | 'date'> = {
                type: 'Consultation',
                title: 'Follow-up Consultation Scheduled',
                description: `Patient scheduled a follow-up consultation for ${formattedDateTime}.`,
                context: { consultDateTime: `${formattedDate}, ${dateTime.time}` }
            };
            onUpdatePatient(activePatient.id, followUpEvent, {
                status: 'Consultation Scheduled',
                nextAction: `Attend follow-up call on ${formattedDateTime}`
            });
        }

        const currentCycleCount = cycles.length;
        const expectedNextWeek = currentCycleCount * 4 + 1;

        if (activeWeek < expectedNextWeek) {
            const nextMonth = new Date();
            nextMonth.setMonth(new Date().getMonth() + cycles.length);
            const newCycle: Cycle = {
                id: cycles.length + 1,
                month: nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
            };

            setCycles(prevCycles => {
                const newCycles = [...prevCycles, newCycle];
                setActiveWeek(1 + (prevCycles.length * 4));
                return newCycles;
            });
        }

        setTimeout(() => {
            setIsSchedulingFollowUp(false);
        }, 3500);
    };

    // Default patient data fallback if not provided (for standalone testing)
    const activePatient = patient || {
        name: 'Patient',
        currentPrescription: { name: 'GLP-1', dosage: 'Start Dose', instructions: '' },
        carePlan: {
            medicationSchedule: { dayOfWeek: 0, timeOfDay: '' },
            nutrition: { proteinGrams: 0, waterLitres: 0 },
            fitness: { weeklyGoal: 0, type: '', protocol: { name: '', description: '', routines: [] } },
            mindbody: []
        },
        dailyLogs: {}
    } as any;

    const currentStage = activePatient.treatmentPlan?.stages.find((s: any) => s.id === activePatient.treatmentPlan?.currentStageId);

    return (
        <div>
            <div className="flex flex-col items-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-brand-text text-center">Treatment Dashboard</h2>

                {currentStage && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Stage:</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full text-white uppercase tracking-wider ${currentStage.color}`}>
                            {currentStage.title}
                        </span>
                    </div>
                )}

                {/* View Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-xl mt-6">
                    <button
                        onClick={() => setView('daily')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${view === 'daily' ? 'bg-white text-brand-purple shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Daily Coach
                    </button>
                    <button
                        onClick={() => setView('weekly')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${view === 'weekly' ? 'bg-white text-brand-purple shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Weekly Progress
                    </button>
                </div>
            </div>

            {view === 'daily' ? (
                <DailyTracker patient={activePatient} onUpdatePatient={onUpdatePatient} />
            ) : (
                <div className="animate-fade-in">
                    {followUpConfirmed && (
                        <div className="mb-8 p-5 bg-white rounded-2xl border border-gray-200 shadow-lg animate-fade-in transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-purple/10 rounded-lg flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-brand-text">Next Follow-up Call</h3>
                                        <p className="text-lg font-semibold text-brand-purple">{followUpConfirmed}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleScheduleFollowUpClick}
                                    className="px-5 py-2 text-sm font-semibold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition-colors"
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {cycles.map((cycle, cycleIndex) => (
                            <div key={cycle.id} className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="text-xl font-bold text-brand-text mb-4 px-2">{cycle.month} Stage</h3>
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(week => {
                                        const overallWeekNumber = week + (cycleIndex * 4);
                                        return (
                                            <WeekLog
                                                key={overallWeekNumber}
                                                weekNumber={overallWeekNumber}
                                                isActive={activeWeek === overallWeekNumber}
                                                isCompleted={activeWeek > overallWeekNumber}
                                                onToggle={() => handleToggleWeek(overallWeekNumber)}
                                                isLastWeek={week === 4 && cycleIndex === cycles.length - 1 && !followUpConfirmed}
                                                onScheduleFollowUp={handleScheduleFollowUpClick}
                                                onSave={(data) => {
                                                    if (onUpdatePatient) {
                                                        const weekLogEvent: Omit<TimelineEvent, 'id' | 'date'> = {
                                                            type: 'Note',
                                                            title: `Week ${overallWeekNumber} Log Submitted`,
                                                            description: `Patient logged weight (${data.weight}kg) and shared ${data.sideEffects ? 'side effects and ' : ''}notes.`
                                                        };

                                                        const newWeeklyLogs = [...(activePatient.weeklyLogs || [])];
                                                        const existingIndex = newWeeklyLogs.findIndex(l => l.week === overallWeekNumber);

                                                        const logEntry = {
                                                            week: overallWeekNumber,
                                                            weight: data.weight,
                                                            sideEffects: data.sideEffects,
                                                            notes: data.notes
                                                        };

                                                        if (existingIndex >= 0) {
                                                            newWeeklyLogs[existingIndex] = logEntry;
                                                        } else {
                                                            newWeeklyLogs.push(logEntry);
                                                        }

                                                        onUpdatePatient(activePatient.id, weekLogEvent, { weeklyLogs: newWeeklyLogs });
                                                        alert(`Week ${overallWeekNumber} log saved successfully!`);
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isSchedulingFollowUp && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative animate-slide-in-up">

                        {!followUpConfirmed || (followUpConfirmed && isSchedulingFollowUp) && (
                            <button
                                onClick={() => setIsSchedulingFollowUp(false)}
                                className="absolute top-3 right-3 p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                                aria-label="Close scheduler"
                            >
                                <CloseIcon />
                            </button>
                        )}

                        {followUpConfirmed && !isSchedulingFollowUp ? (
                            <div className="text-center">
                                <ConfirmationCheckIcon />
                                <h2 className="text-2xl font-bold text-brand-text">Follow-up Booked!</h2>
                                <p className="mt-2 text-brand-text-light">Your appointment is confirmed for <br /><span className="font-semibold text-brand-purple">{followUpConfirmed}</span>.</p>
                                <p className="mt-4 text-sm text-brand-text-light">Your next treatment stage is now available on your dashboard.</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-brand-text text-center mb-2">Schedule Follow-up</h2>
                                <p className="text-center text-brand-text-light mb-6">
                                    Book a time to chat with your care team about your progress.
                                </p>
                                <ConsultationScheduler
                                    onSchedule={handleFollowUpScheduled}
                                    minBookingNoticeDays={2}
                                    buttonText="Confirm Follow-up Call"
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreatmentTimeline;
