
import React from 'react';
import { Patient, TreatmentPlanStage, defaultTreatmentPlanStages } from '../../constants';
import { CheckCircle2, Circle, Calendar, Clock, User } from 'lucide-react';

interface TreatmentPlanPanelProps {
    patient: Patient;
    className?: string;
}

const TreatmentPlanPanel: React.FC<TreatmentPlanPanelProps> = ({ patient, className = "" }) => {
    // Fallback for patients without a treatment plan (e.g. from stale localStorage)
    const plan = patient.treatmentPlan || {
        currentStageId: 'stage1',
        startDate: new Date().toISOString(),
        stages: defaultTreatmentPlanStages
    };

    const currentStageIndex = plan.stages.findIndex(s => s.id === plan.currentStageId);

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-brand-purple" />
                    <h3 className="text-xl font-bold text-gray-900">Treatment Plan</h3>
                </div>
                <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                    6 Month Program
                </div>
            </div>

            <div className="p-6">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                    <div className="space-y-8">
                        {plan.stages.map((stage, index) => {
                            const isCompleted = index < currentStageIndex;
                            const isCurrent = index === currentStageIndex;
                            const isFuture = index > currentStageIndex;

                            return (
                                <div key={stage.id} className="relative pl-10">
                                    {/* Status Indicator */}
                                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm ${
                                        isCompleted ? 'bg-green-500 text-white' : 
                                        isCurrent ? `${stage.color} text-white ring-4 ring-opacity-20 ${stage.color.replace('bg-', 'ring-')}` : 
                                        'bg-gray-100 text-gray-400'
                                    }`}>
                                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : 
                                         isCurrent ? <Clock className="h-4 w-4 animate-pulse" /> : 
                                         <Circle className="h-4 w-4" />}
                                    </div>

                                    <div className={`p-4 rounded-xl border transition-all ${
                                        isCurrent ? `bg-white border-gray-200 shadow-md scale-[1.02]` : 
                                        isCompleted ? 'bg-gray-50/50 border-gray-100 opacity-70' : 
                                        'bg-white border-gray-100 opacity-50'
                                    }`}>
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold ${isCurrent ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {stage.title}
                                                </h4>
                                                {isCurrent && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider ${stage.color}`}>
                                                        Current Stage
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {stage.duration}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {stage.description}
                                        </p>
                                        
                                        {isCurrent && stage.type === 'consultation' && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-brand-purple/10 flex items-center justify-center">
                                                        <User className="h-3 w-3 text-brand-purple" />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-700">With {patient.careTeam.physician}</span>
                                                </div>
                                                <button className="text-[10px] font-bold text-brand-purple hover:text-brand-purple/80 uppercase tracking-widest">
                                                    Schedule Now
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TreatmentPlanPanel;
