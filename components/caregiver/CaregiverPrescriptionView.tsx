
import React from 'react';
import { Prescription } from '../../constants';

interface CareCoordinatorPrescriptionViewProps {
    prescription: Prescription;
}

const CareCoordinatorPrescriptionView: React.FC<CareCoordinatorPrescriptionViewProps> = ({ prescription }) => {
    return (
        <div className="space-y-3">
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medication</p>
                <p className="text-lg font-bold text-brand-purple">{prescription.name}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dosage</p>
                <p className="text-gray-800">{prescription.dosage}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Instructions</p>
                <p className="text-sm text-gray-600">{prescription.instructions}</p>
            </div>
        </div>
    );
};

export default CareCoordinatorPrescriptionView;
