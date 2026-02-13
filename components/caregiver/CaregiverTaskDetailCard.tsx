
import React from 'react';
import { CareCoordinatorTask } from '../../constants';

interface CareCoordinatorTaskDetailCardProps {
    task: CareCoordinatorTask;
}

const ContextRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="mb-4 last:mb-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="text-gray-900 font-medium text-sm">{value}</div>
    </div>
);

const CareCoordinatorTaskDetailCard: React.FC<CareCoordinatorTaskDetailCardProps> = ({ task }) => {

    const renderContent = () => {
        if (task.context?.prescription) {
            const rx = task.context.prescription;
            return (
                <>
                    <ContextRow label="Medication" value={<span className="text-brand-purple font-bold text-lg">{rx.name}</span>} />
                    <ContextRow label="Dosage" value={rx.dosage} />
                    <ContextRow label="Instructions" value={rx.instructions} />
                </>
            );
        }

        if (task.context?.labDateTime) {
            return <ContextRow label="Scheduled Lab" value={task.context.labDateTime} />;
        }

        if (task.context?.requestedTests) {
            return <ContextRow label="Doctor Ordered" value={task.context.requestedTests} />;
        }

        return (
            <>
                {task.detailsList.map((details, idx) => (
                    <ContextRow key={idx} label={`Detail ${task.detailsList.length > 1 ? idx + 1 : ''}`} value={details} />
                ))}
                <ContextRow label="Priority" value={<span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{task.priority}</span>} />
            </>
        );
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
            <h2 className="text-lg font-bold text-gray-400 mb-6 border-b border-gray-100 pb-2">Task Context</h2>
            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default CareCoordinatorTaskDetailCard;
