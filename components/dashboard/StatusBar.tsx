
import React from 'react';
import { dashboardSteps } from '../../constants';

type DashboardStepId = typeof dashboardSteps[number]['id'];

interface StatusBarProps {
    currentStepId: DashboardStepId;
    onStepClick: (stepId: DashboardStepId) => void;
    progress?: number;
}

const CheckIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;

const StatusBar: React.FC<StatusBarProps> = ({ currentStepId, onStepClick, progress }) => {
    
    const steps = dashboardSteps;
    const currentStepIndex = steps.findIndex(step => step.id === currentStepId);

    return (
        <div className="w-full overflow-x-auto pb-6 pt-2 [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center min-w-max gap-4 px-1">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    let statusStyles = {
                        card: 'bg-white border-gray-200 text-gray-500 hover:border-brand-purple/50 hover:shadow-md',
                        iconBg: 'bg-gray-100 text-gray-400',
                        text: 'text-gray-500',
                        label: 'text-gray-400'
                    };

                    if(isCompleted) {
                         statusStyles = {
                            card: 'bg-green-50/50 border-green-200 text-green-700',
                            iconBg: 'bg-green-100 text-green-600',
                            text: 'text-green-800 font-medium',
                            label: 'text-green-600/70'
                        };
                    } else if (isCurrent) {
                         statusStyles = {
                            card: 'bg-white border-brand-purple ring-2 ring-brand-purple/20 shadow-xl shadow-brand-purple/10 scale-[1.02]',
                            iconBg: 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30',
                            text: 'text-brand-purple font-bold',
                            label: 'text-brand-purple/70'
                        };
                    }

                    return (
                        <button 
                            key={step.id} 
                            onClick={() => onStepClick(step.id)} 
                            className={`relative flex items-center gap-4 px-6 py-5 rounded-2xl border transition-all duration-300 min-w-[240px] ${statusStyles.card}`}
                        >
                            <div className="relative">
                                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all duration-300 ${statusStyles.iconBg}`}>
                                    {isCompleted ? <CheckIcon /> : step.icon}
                                </div>
                                {isCurrent && progress !== undefined && progress > 0 && (
                                     <svg className="absolute -top-1 -left-1 w-12 h-12 rotate-[-90deg] pointer-events-none" viewBox="0 0 48 48">
                                        <circle 
                                            cx="24" cy="24" r="21" 
                                            stroke="#F3E8FF" strokeWidth="3" fill="none" 
                                        />
                                        <circle
                                            cx="24" cy="24" r="21"
                                            stroke="#C084FC" strokeWidth="3" fill="none"
                                            strokeDasharray="131.95" // 2 * pi * 21
                                            strokeDashoffset={131.95 - (131.95 * progress) / 100}
                                            strokeLinecap="round"
                                            className="transition-all duration-500 ease-out"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 ${statusStyles.label}`}>Step 0{index + 1}</p>
                                <h4 className={`text-sm truncate ${statusStyles.text}`}>
                                    {step.name} 
                                    {isCurrent && progress !== undefined && progress > 0 && (
                                        <span className="ml-2 text-xs font-normal text-brand-purple opacity-75">{progress}%</span>
                                    )}
                                </h4>
                            </div>
                            {isCurrent && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-brand-purple rounded-full"></div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default StatusBar;
