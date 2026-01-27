
import React from 'react';
import { mockAppointments, DoctorAppointment, Patient } from '../../constants';

interface DoctorScheduleScreenProps {
    allPatients: Patient[];
    onPatientSelect: (patient: Patient) => void;
}


const DoctorScheduleScreen: React.FC<DoctorScheduleScreenProps> = ({ allPatients, onPatientSelect }) => {
    // Group appointments by date
    const appointmentsByDate = mockAppointments.reduce((acc, appointment) => {
        (acc[appointment.date] = acc[appointment.date] || []).push(appointment);
        return acc;
    }, {} as Record<string, DoctorAppointment[]>);

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Schedule</h1>
                <p className="mt-1 text-gray-600">Review and manage your upcoming consultations.</p>
            </div>

            <div className="space-y-8">
                {Object.entries(appointmentsByDate).map(([date, appointments]) => (
                    <div key={date}>
                        <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">{date}</h2>
                        <div className="space-y-4">
                            {appointments.map(apt => {
                                const patient = allPatients.find(p => p.id === apt.patientId);
                                return (
                                    <div key={apt.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <img src={apt.patientImageUrl} alt={apt.patientName} className="w-12 h-12 rounded-full object-cover"/>
                                            <div>
                                                {patient ? (
                                                     <button onClick={() => onPatientSelect(patient)} className="font-bold text-gray-900 hover:text-brand-purple hover:underline text-left">
                                                        {apt.patientName}
                                                     </button>
                                                ) : (
                                                    <p className="font-bold text-gray-900">{apt.patientName}</p>
                                                )}
                                                <p className="text-sm text-gray-600">{apt.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-semibold text-brand-purple text-right">{apt.time}</p>
                                            <button className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                                                Join Now
                                            </button>
                                        </div>
                                    </div>
                                )}
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DoctorScheduleScreen;
