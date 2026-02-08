
import React, { useState } from 'react';
import { Patient, TimelineEvent } from '../../constants';

interface PatientActionsProps {
    patient: Patient;
    onUpdatePatient?: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => void;
}

const PatientActions: React.FC<PatientActionsProps> = ({ patient, onUpdatePatient }) => {
    const [isActionProcessing, setIsActionProcessing] = useState(false);

    // Helper to perform update
    const performUpdate = (event: Omit<TimelineEvent, 'id' | 'date'>, updates: Partial<Patient>) => {
        if (!onUpdatePatient) return;
        setIsActionProcessing(true);
        setTimeout(() => {
            onUpdatePatient(patient.id, event, updates);
            setIsActionProcessing(false);
        }, 1500);
    }

    // Doctor reviews intake and orders labs
    const handleReviewMetabolicProfile = () => {
        const event = {
            type: 'Labs',
            title: 'Labs Ordered',
            description: 'Metabolic Fingerprint reviewed. Comprehensive panel ordered.',
            doctor: patient.careTeam.physician
        } as const;
        const updates: Partial<Patient> = {
            status: 'Awaiting Lab Confirmation',
            nextAction: 'Patient to book lab appointment'
        };
        performUpdate(event, updates);
    };

    // Generic resolution for flagged items
    const handleResolveFlag = () => {
        const event = {
            type: 'Note',
            title: 'Issue Resolved',
            description: 'Clinical flag addressed by physician.',
            doctor: patient.careTeam.physician
        } as const;
        const updates: Partial<Patient> = {
            status: 'Ongoing Treatment',
            nextAction: 'Routine monitoring'
        };
        performUpdate(event, updates);
    };

    if (isActionProcessing) {
        return (
            <div className="bg-white border-2 border-brand-purple/20 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[150px]">
                <svg className="animate-spin h-8 w-8 text-brand-purple mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="text-sm font-semibold text-brand-purple">Processing Clinical Action...</p>
            </div>
        )
    }

    const showReviewAction = patient.status === 'Labs Ordered';
    const showAlertAction = patient.status === 'Action Required';

    if (!showReviewAction && !showAlertAction) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Contextual Clinical Actions */}
            {showReviewAction && (
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-bold text-blue-900 mb-2">Metabolic Review</h2>
                    <p className="text-sm text-blue-800 mb-4">Patient intake verified. Review history and authorize lab panel.</p>
                    <button
                        onClick={handleReviewMetabolicProfile}
                        className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                    >
                        Approve & Order Labs
                    </button>
                </div>
            )}

            {showAlertAction && (
                <div className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl shadow-lg animate-pulse-slow">
                    <h2 className="text-xl font-bold text-red-800 mb-3">Clinical Alert</h2>
                    <div className="bg-white p-4 rounded-lg border border-red-100">
                        <p className="font-semibold text-gray-800">Reason: {patient.nextAction}</p>
                        <p className="text-sm text-gray-600 mt-1">Review chart and contact patient if necessary.</p>
                    </div>
                    <button
                        onClick={handleResolveFlag}
                        className="w-full mt-4 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md"
                    >
                        Mark as Resolved
                    </button>
                </div>
            )}
        </div>
    );
};

export default PatientActions;
