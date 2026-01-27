
import React, { useState, useMemo } from 'react';
import ConsultationScheduler from './ConsultationScheduler';
import { Patient, WorkoutRoutine, DailyLog, TimelineEvent } from '../../constants';

interface TreatmentTimelineProps {
    patient?: Patient;
    onUpdatePatient?: (patientId: number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates?: Partial<Patient>) => void;
}

interface WeekLogProps {
    weekNumber: number;
    isActive: boolean;
    isCompleted: boolean;
    onToggle: () => void;
    isLastWeek: boolean;
    onScheduleFollowUp: () => void;
}

const GradientButton: React.FC<{ children: React.ReactNode, onClick?: () => void, className?: string, disabled?: boolean }> = ({ children, onClick, className="", disabled=false }) => (
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

const TaskCard: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    isCompleted: boolean; 
    onToggle: () => void; 
    subtitle?: string;
    actionControl?: React.ReactNode 
}> = ({ title, icon, isCompleted, onToggle, subtitle, actionControl }) => (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:shadow-md'}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {icon}
                </div>
                <div>
                    <h4 className={`font-bold ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>{title}</h4>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
            </div>
            {actionControl ? actionControl : (
                <button 
                    onClick={onToggle}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </button>
            )}
        </div>
    </div>
);

const getDailyInsight = (patient: Patient, date: Date): string => {
    // Simple deterministic random generator based on date
    const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear() * 366;
    const name = patient.name.split(' ')[0];
    const proteinGoal = patient.carePlan?.nutrition.proteinGrams || 120;
    const waterGoal = patient.carePlan?.nutrition.waterLitres || 2.5;

    const insights = [
        // Motivation
        `Consistency is your superpower, ${name}. Every logged meal counts towards your ${patient.goal}.`,
        `"The only bad workout is the one that didn't happen." Even a 10-minute walk helps GLP-1 efficacy.`,
        `Be patient with your body. Sustainable metabolic change takes time, but you're on the right path.`,
        `Visualize your goal of ${patient.goal}. Small daily wins like today's tracking make it reality.`,
        
        // Nutrition/Hydration
        `Protein check! Aiming for ${proteinGoal}g today helps preserve lean muscle mass while you lose fat.`,
        `Hydration tip: Drinking ${waterGoal}L of water helps mitigate common GLP-1 side effects like nausea.`,
        `Fiber is your friend. It helps with digestion and keeps you fuller for longer alongside your medication.`,
        `Eating slowly allows your GLP-1 medication to signal fullness effectively. Take your time with meals today.`,
        
        // Health/Medical
        `Did you know? GLP-1s also improve cardiovascular markers. You're doing great for your heart health.`,
        `Sleep affects hunger hormones too. Prioritize 7-8 hours tonight to support your metabolic reset.`,
        `Stress raises cortisol, which can stall weight loss. Your ${patient.carePlan?.mindbody?.[0] || 'mindfulness'} practice is scientifically important!`,
        `Muscle mass is metabolically active tissue. That resistance training is boosting your resting calorie burn.`,
    ];

    // Mix in dynamic report data if available
    if (patient.vitals.some(v => v.label === 'Weight' && v.trend === 'down')) {
        insights.push(`Your weight trend is looking fantastic. That downward curve is proof your lifestyle changes are working.`);
    }
    if (patient.vitals.some(v => v.label === 'BMI' && v.trend === 'down')) {
        insights.push(`Your BMI is trending down. This significantly lowers risk factors for long-term health issues.`);
    }

    return insights[seed % insights.length];
};

const DailyTracker: React.FC<{ patient: Patient; onUpdatePatient?: (id: number, e: null, u: Partial<Patient>) => void }> = ({ patient, onUpdatePatient }) => {
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
        proteinIntake: 60, // Mock default starting value for better UX
        waterIntake: 3,    // Mock default starting value for better UX
        mindsetCompleted: [],
        fitnessCompleted: false
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

    const isMedicationDay = selectedDate.getDay() === carePlan.medicationSchedule.dayOfWeek;
    const proteinGoal = carePlan.nutrition.proteinGrams;
    const waterGoal = Math.round(carePlan.nutrition.waterLitres * 4); // Approx glasses (250ml)
    
    // Determine the workout for today/general routine
    const workoutRoutine = carePlan.fitness.protocol?.routines[0];

    // Calculate completion for coach insight icon state
    let totalTasks = 2; // Nutrition (Protein) + Fitness
    totalTasks += carePlan.mindbody.length; // Add mindset tasks
    if (isMedicationDay) totalTasks++;

    let completedCount = (activeLog.proteinIntake >= proteinGoal ? 1 : 0) + (activeLog.fitnessCompleted ? 1 : 0);
    completedCount += activeLog.mindsetCompleted.length;
    if (isMedicationDay && activeLog.medicationTaken) completedCount++;

    const dailyInsight = useMemo(() => getDailyInsight(patient, selectedDate), [patient, selectedDate]);

    return (
        <div className="animate-fade-in">
            {/* Calendar Strip */}
            <div className="flex justify-between items-center mb-8 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                {dates.map((date, idx) => {
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === today.toDateString();
                    return (
                        <button 
                            key={idx} 
                            onClick={() => setSelectedDate(date)}
                            className={`flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all min-w-[3rem] ${isSelected ? 'bg-brand-text text-white shadow-lg scale-105' : 'hover:bg-gray-50 text-gray-500'}`}
                        >
                            <span className="text-[10px] uppercase font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className={`text-lg font-bold ${isSelected ? 'text-white' : isToday ? 'text-brand-purple' : 'text-gray-800'}`}>{date.getDate()}</span>
                        </button>
                    )
                })}
            </div>

            <CoachInsightBanner insight={dailyInsight} completedTasks={completedCount} totalTasks={totalTasks} />

            <div className="space-y-4">
                {/* Medication Task - Only on specific days */}
                {isMedicationDay && (
                    <TaskCard 
                        title="Medication Due" 
                        subtitle={`${patient.currentPrescription.name} - ${patient.currentPrescription.dosage}`}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                        isCompleted={activeLog.medicationTaken}
                        onToggle={() => updateLog('medicationTaken', !activeLog.medicationTaken)}
                    />
                )}

                {/* Nutrition - Protein */}
                <TaskCard 
                    title="Protein Goal" 
                    subtitle={`${activeLog.proteinIntake}g / ${proteinGoal}g`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                    isCompleted={activeLog.proteinIntake >= proteinGoal}
                    onToggle={() => {}}
                    actionControl={
                        <div className="flex items-center gap-3">
                            <button onClick={() => updateLog('proteinIntake', Math.max(0, activeLog.proteinIntake - 10))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">-</button>
                            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div className="bg-brand-purple h-full transition-all duration-300" style={{ width: `${Math.min(100, (activeLog.proteinIntake/proteinGoal)*100)}%` }}></div>
                            </div>
                            <button onClick={() => updateLog('proteinIntake', activeLog.proteinIntake + 10)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">+</button>
                        </div>
                    }
                />

                {/* Hydration */}
                <TaskCard 
                    title="Hydration" 
                    subtitle={`${activeLog.waterIntake} / ${waterGoal} glasses`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>}
                    isCompleted={activeLog.waterIntake >= waterGoal}
                    onToggle={() => {}}
                    actionControl={
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateLog('waterIntake', Math.max(0, activeLog.waterIntake - 1))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-600 font-bold">-</button>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => ( 
                                    <div 
                                        key={i} 
                                        className={`w-6 h-8 rounded-b-lg rounded-t-sm border border-brand-cyan/30 transition-all duration-300 ${i < activeLog.waterIntake ? 'bg-brand-cyan shadow-sm' : 'bg-brand-cyan/5'}`}
                                    ></div>
                                ))}
                            </div>
                            <button onClick={() => updateLog('waterIntake', activeLog.waterIntake + 1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-600 font-bold">+</button>
                            {activeLog.waterIntake > 5 && <span className="text-sm font-bold text-brand-cyan ml-1">+{activeLog.waterIntake - 5}</span>}
                        </div>
                    }
                />
                
                {/* Fitness - MuscleProtect Workout */}
                <TaskCard 
                    title={workoutRoutine?.title || carePlan.fitness.type}
                    subtitle={workoutRoutine ? `${workoutRoutine.durationMin} min • ${carePlan.fitness.protocol?.name}` : "Daily Movement"}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                    isCompleted={activeLog.fitnessCompleted}
                    onToggle={() => updateLog('fitnessCompleted', !activeLog.fitnessCompleted)}
                    actionControl={
                        <div className="flex items-center gap-2">
                            {workoutRoutine && (
                                <button 
                                    onClick={() => setIsWorkoutModalOpen(true)}
                                    className="px-3 py-1.5 text-xs font-bold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition-colors"
                                >
                                    View Routine
                                </button>
                            )}
                            <button 
                                onClick={() => updateLog('fitnessCompleted', !activeLog.fitnessCompleted)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeLog.fitnessCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </button>
                        </div>
                    }
                />

                {/* Mind & Body - Meditation / Breathing */}
                {carePlan.mindbody.map((task, idx) => (
                    <TaskCard 
                        key={idx}
                        title={task}
                        subtitle="Recommended for stress management"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        isCompleted={activeLog.mindsetCompleted.includes(task)}
                        onToggle={() => {
                            const current = activeLog.mindsetCompleted;
                            const updated = current.includes(task) 
                                ? current.filter(t => t !== task)
                                : [...current, task];
                            updateLog('mindsetCompleted', updated);
                        }}
                    />
                ))}
            </div>

            {/* Workout Detail Modal */}
            {isWorkoutModalOpen && workoutRoutine && (
                <WorkoutModal routine={workoutRoutine} onClose={() => setIsWorkoutModalOpen(false)} />
            )}
        </div>
    );
}


// --- Weekly Progress Sub-Components ---

const WeekLog: React.FC<WeekLogProps> = ({ weekNumber, isActive, isCompleted, onToggle, isLastWeek, onScheduleFollowUp }) => {
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
                            <input type="number" id={`weight-${weekNumber}`} className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="e.g., 80" />
                        </div>
                        <div>
                            <label htmlFor={`side-effects-${weekNumber}`} className="block text-sm font-semibold text-brand-text mb-1">Any Side Effects?</label>
                            <textarea id={`side-effects-${weekNumber}`} rows={2} className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="e.g., Mild nausea for a day after injection."></textarea>
                        </div>
                         <div>
                            <label htmlFor={`notes-${weekNumber}`} className="block text-sm font-semibold text-brand-text mb-1">Notes for Your Doctor</label>
                            <textarea id={`notes-${weekNumber}`} rows={2} className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple" placeholder="e.g., Feeling great this week, cravings are much lower."></textarea>
                        </div>
                        <button className="w-full px-4 py-2 font-semibold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20">Save Log</button>
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
        const formattedDateTime = `${dateTime.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${dateTime.time}`;
        setFollowUpConfirmed(formattedDateTime);

        const currentCycleCount = cycles.length;
        const expectedNextWeek = currentCycleCount * 4 + 1;

        if(activeWeek < expectedNextWeek) {
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

    return (
        <div>
            <div className="flex flex-col items-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-brand-text text-center">Treatment Dashboard</h2>
                
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
                                 <h3 className="text-xl font-bold text-brand-text mb-4 px-2">{cycle.month} Cycle</h3>
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
                                <p className="mt-2 text-brand-text-light">Your appointment is confirmed for <br/><span className="font-semibold text-brand-purple">{followUpConfirmed}</span>.</p>
                                <p className="mt-4 text-sm text-brand-text-light">Your next treatment cycle is now available on your dashboard.</p>
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
