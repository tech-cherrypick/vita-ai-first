
import React from 'react';
import { Patient } from '../../constants';

interface PrescriptionViewProps {
    patient: Patient;
}

const PrescriptionView: React.FC<PrescriptionViewProps> = ({ patient }) => {
    return (
        <div className="mt-8 max-w-lg mx-auto bg-white border border-gray-200 rounded-2xl p-6 text-left shadow-lg animate-fade-in">
            <div className="flex justify-between items-start pb-4 border-b border-dashed">
                <div>
                    <h3 className="text-xl font-bold text-brand-text">Treatment Pathway</h3>
                    <p className="text-sm text-brand-text-light">Authorized by {patient.careTeam.physician}</p>
                </div>
                 <div className="text-right">
                    <p className="text-sm font-semibold text-brand-text">Vita Health</p>
                    <p className="text-xs text-brand-text-light">Plan ID: VT-META-094</p>
                 </div>
            </div>
            
            <div className="mt-6 space-y-6">
                {/* Medication Section */}
                <div className="bg-brand-purple/5 p-4 rounded-xl border border-brand-purple/10">
                    <h4 className="flex items-center gap-2 font-bold text-brand-purple mb-3">
                        <span>💊</span> GLP-1 Therapy
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Medication</label>
                            <p className="font-semibold text-brand-text">{patient.currentPrescription.name}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Dosage</label>
                            <p className="font-semibold text-brand-text">{patient.currentPrescription.dosage}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Instructions</label>
                            <p className="text-sm text-brand-text">{patient.currentPrescription.instructions}</p>
                        </div>
                    </div>
                </div>

                {/* MuscleProtect Protocol Section */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                     <h4 className="flex items-center gap-2 font-bold text-blue-800 mb-3">
                        <span>💪</span> MuscleProtect Protocol
                    </h4>
                    <div className="space-y-2 text-sm text-blue-900">
                        <div className="flex justify-between">
                            <span>Daily Protein Target:</span>
                            <span className="font-bold">120g - 140g</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Resistance Training:</span>
                            <span className="font-bold">3x / week (Min. 20 mins)</span>
                        </div>
                    </div>
                </div>
                
                 {/* Lifestyle Plan Section */}
                 <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                     <h4 className="flex items-center gap-2 font-bold text-green-800 mb-3">
                        <span>🥗</span> Lifestyle & Nutrition
                    </h4>
                    <p className="text-sm text-green-900">
                        Focus on fiber-rich whole foods. Hydration target: 3L daily.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default PrescriptionView;
