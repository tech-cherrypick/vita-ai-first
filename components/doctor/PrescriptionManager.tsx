
import React, { useState } from 'react';
import { Patient, PrescriptionLog, TimelineEvent } from '../../constants';

interface InfoRowProps {
    label: string;
    value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg text-gray-800">{value}</p>
    </div>
);

interface PrescriptionManagerProps {
    patient: Patient;
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
}

const PrescriptionManager: React.FC<PrescriptionManagerProps> = ({ patient, onUpdatePatient }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMedication, setNewMedication] = useState(patient.currentPrescription.name);
    const [newDosage, setNewDosage] = useState(patient.currentPrescription.dosage);
    const [notes, setNotes] = useState('');

    const handleModify = () => {
        setIsModalOpen(true);
        setNewMedication(patient.currentPrescription.name);
        setNewDosage(patient.currentPrescription.dosage);
        setNotes('');
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();

        const isInitialPrescription = patient.prescriptionHistory.length === 0;

        const newLogEntry: PrescriptionLog = {
            id: `ph${patient.prescriptionHistory.length + 1}`,
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            medication: newMedication,
            dosage: newDosage,
            notes: notes || (isInitialPrescription ? 'Initial prescription.' : 'Prescription updated.'),
            doctor: patient.careTeam.physician
        };

        const timelineEvent: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Note',
            title: isInitialPrescription ? 'Initial prescription.' : 'Prescription updated.',
            description: `Medication set to ${newMedication} at ${newDosage}.`,
            doctor: patient.careTeam.physician
        };

        const updatedPatientData: Partial<Patient> = {
            status: 'Awaiting Shipment', // Triggers Care Coordinator task
            nextAction: 'Caregiver to ship medication',
            currentPrescription: {
                ...patient.currentPrescription,
                name: newMedication,
                dosage: newDosage
            },
            prescriptionHistory: [newLogEntry, ...patient.prescriptionHistory]
        };

        onUpdatePatient(patient.id, timelineEvent, updatedPatientData);
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-900">Prescription Management</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleModify}
                            className="px-4 py-2 text-sm font-semibold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition-colors">
                            Write / Modify Rx
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <InfoRow label="Medication" value={patient.currentPrescription.name} />
                    <InfoRow label="Current Dosage" value={patient.currentPrescription.dosage} />
                    <div className="md:col-span-2">
                        <InfoRow label="Instructions" value={patient.currentPrescription.instructions} />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Rx History</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {patient.prescriptionHistory.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No prescription history.</p>
                        ) : (
                            patient.prescriptionHistory.map(log => (
                                <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-semibold text-gray-900">{log.medication} - {log.dosage}</p>
                                        <p className="text-xs text-gray-500">{log.date}</p>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Note: {log.notes}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg relative animate-slide-in-up">
                        <h2 className="text-2xl font-bold text-brand-text mb-4">Write Prescription</h2>
                        <form onSubmit={handleSaveChanges} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Medication</label>
                                <input
                                    type="text"
                                    value={newMedication}
                                    onChange={e => setNewMedication(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Dosage</label>
                                <input
                                    type="text"
                                    value={newDosage}
                                    onChange={e => setNewDosage(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Clinical Justification / Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                                    placeholder="e.g., Initiating treatment protocol."
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-brand-purple rounded-lg hover:opacity-90">Approve & Send to Coordinator</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default PrescriptionManager;
