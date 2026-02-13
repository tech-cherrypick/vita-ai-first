
import React, { useState } from 'react';
import { DoctorAppointment, Patient } from '../../constants';

interface DoctorScheduleScreenProps {
    allPatients: Patient[];
    onPatientSelect: (patient: Patient) => void;
}


const DoctorScheduleScreen: React.FC<DoctorScheduleScreenProps> = ({ allPatients, onPatientSelect }) => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

    // Derive appointments from real patient data
    const appointments: DoctorAppointment[] = allPatients
        .filter(patient => {
            // Check if consultation data exists and has minimal required fields
            const consult = patient.tracking?.consultation;
            if (!consult) return false;
            return (consult.date && consult.time);
        })
        .map(patient => {
            const consult = patient.tracking?.consultation;
            // Safe extraction
            let dateStr = consult.date;

            // Handle Firestore Timestamp
            if (dateStr && typeof dateStr === 'object' && 'toDate' in dateStr) {
                dateStr = (dateStr as any).toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
            // Handle JS Date object
            else if (dateStr instanceof Date) {
                dateStr = dateStr.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
            // Handle ISO String (e.g. "2026-02-18T18:30:00.000Z")
            else if (typeof dateStr === 'string' && !dateStr.includes(' ') && !isNaN(Date.parse(dateStr))) {
                const d = new Date(dateStr);
                dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }

            return {
                id: `consult_${patient.id}`,
                patientId: patient.id,
                patientName: patient.name,
                patientImageUrl: patient.imageUrl || patient.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
                time: consult.time,
                date: dateStr,
                type: consult.type || 'Consultation'
            };
        });

    // Helper to compare dates
    const getTimestamp = (dateStr: string, timeStr: string) => {
        try {
            // Remove day names if present (e.g., "Monday, January 1") to help parsing
            const cleanDate = dateStr.replace(/^[A-Za-z]+, /, '');
            return new Date(`${cleanDate} ${timeStr}`).getTime();
        } catch (e) {
            return 0;
        }
    };

    const now = Date.now();

    const upcomingAppointments = appointments
        .filter(apt => getTimestamp(apt.date, apt.time) > now)
        .sort((a, b) => getTimestamp(a.date, a.time) - getTimestamp(b.date, b.time));

    const completedAppointments = appointments
        .filter(apt => getTimestamp(apt.date, apt.time) <= now)
        .sort((a, b) => getTimestamp(b.date, b.time) - getTimestamp(a.date, a.time));

    const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : completedAppointments;

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Schedule</h1>
                    <p className="mt-1 text-gray-600">Manage your consultations.</p>
                </div>

                {/* Tabs */}
                <div className="bg-white p-1 rounded-xl border border-gray-200 inline-flex shadow-sm">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'upcoming'
                            ? 'bg-brand-purple text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'completed'
                            ? 'bg-brand-purple text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Completed
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {displayedAppointments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-gray-500">No {activeTab} consultations found.</p>
                    </div>
                ) : (
                    displayedAppointments.map(apt => {
                        const patient = allPatients.find(p => p.id === apt.patientId);

                        return (
                            <div key={apt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={apt.patientImageUrl}
                                            alt={apt.patientName}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                                        />
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>

                                    <div>
                                        {patient ? (
                                            <button
                                                onClick={() => onPatientSelect(patient)}
                                                className="font-bold text-gray-900 text-lg hover:text-brand-purple hover:underline text-left block"
                                            >
                                                {apt.patientName}
                                            </button>
                                        ) : (
                                            <p className="font-bold text-gray-900 text-lg">{apt.patientName}</p>
                                        )}

                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {apt.date}
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {apt.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 sm:border-l sm:border-gray-100 sm:pl-6">
                                    <div className="text-right hidden sm:block">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apt.type === 'Consultation' ? 'bg-purple-100 text-purple-800' :
                                            apt.type === 'Follow-up' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {apt.type}
                                        </span>
                                    </div>

                                    {activeTab === 'upcoming' && (
                                        <button className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-white bg-brand-purple rounded-xl hover:bg-brand-purple/90 transition-all shadow-md shadow-brand-purple/20 flex items-center justify-center gap-2 group">
                                            <span>Join Call</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    )}

                                    {activeTab === 'completed' && (
                                        <button className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                                            View Notes
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DoctorScheduleScreen;
