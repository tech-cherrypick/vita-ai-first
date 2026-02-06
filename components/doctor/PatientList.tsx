
import React from 'react';
import { Patient } from '../../constants';

interface PatientListProps {
    patients: Patient[];
    onPatientSelect: (patient: Patient) => void;
}

const PatientList: React.FC<PatientListProps> = ({ patients, onPatientSelect }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Care Team</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        <img className="h-10 w-10 rounded-full object-cover" src={patient.imageUrl} alt={patient.name} />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                        <div className="text-sm text-gray-500">{patient.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.status === 'Ongoing Treatment' ? 'bg-green-100 text-green-800' : 'bg-brand-purple/10 text-brand-purple'
                                    }`}>
                                    {patient.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {patient.goal}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {patient.careTeam.physician} / {patient.careTeam.coordinator}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => onPatientSelect(patient)}
                                    className="text-brand-purple hover:text-brand-purple/80"
                                >
                                    View Chart
                                </button>
                            </td>
                        </tr>
                    ))}
                    {patients.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                                No patients found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PatientList;
