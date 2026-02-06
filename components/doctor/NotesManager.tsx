import React, { useState } from 'react';
import { Patient, TimelineEvent } from '../../constants';

interface NotesManagerProps {
    patient: Patient;
    onUpdatePatient: (patientId: number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
}

const NotesManager: React.FC<NotesManagerProps> = ({ patient, onUpdatePatient }) => {
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSaveNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;

        setIsSaving(true);
        const newEvent: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Note',
            title: "Doctor's Note",
            description: note,
            doctor: patient.careTeam.physician,
        };

        // Simulate network request
        setTimeout(() => {
            onUpdatePatient(patient.id, newEvent, {});
            setNote('');
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }, 1000);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add a Note</h2>
            <form onSubmit={handleSaveNote}>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 py-2 px-3 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                    placeholder={`Add a clinical note for ${patient.name}...`}
                />
                <div className="mt-4 flex justify-end items-center gap-4">
                    {showSuccess && <p className="text-sm text-green-600 animate-fade-in">Note saved successfully!</p>}
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-semibold text-white bg-brand-purple rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!note.trim() || isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotesManager;
