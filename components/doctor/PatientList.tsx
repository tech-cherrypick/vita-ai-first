
import React from 'react';
import { Patient } from '../../constants';

interface PatientListProps {
    patients: Patient[];
    onPatientSelect: (patient: Patient) => void;
}

const statusStyles: { [key: string]: string } = {
    'Assessment Review': 'bg-yellow-100 text-yellow-800',
    'Labs Ordered': 'bg-blue-100 text-blue-800',
    'Awaiting Lab Confirmation': 'bg-purple-100 text-purple-800',
    'Awaiting Lab Results': 'bg-indigo-100 text-indigo-800', // New Status
    'Consultation Scheduled': 'bg-indigo-100 text-indigo-800',
    'Awaiting Shipment': 'bg-orange-100 text-orange-800',
    'Ongoing Treatment': 'bg-green-100 text-green-800',
    'Action Required': 'bg-red-100 text-red-800 animate-pulse',
};

const PatientList: React.FC<PatientListProps> = ({ patients, onPatientSelect }) => {
    return (
        <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Patient Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Next Action
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">View Chart</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {patients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-full object-cover" src={patient.imageUrl} alt="" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                            <div className="text-sm text-gray-500">{patient.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[patient.status] || 'bg-gray-100 text-gray-800'}`}>
                                        {patient.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{patient.nextAction}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onPatientSelect(patient)} className="text-brand-purple hover:text-brand-purple/80 font-semibold">
                                        View Chart
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
                <ul className="divide-y divide-gray-200">
                    {patients.map(patient => (
                        <li key={patient.id}>
                            <button onClick={() => onPatientSelect(patient)} className="w-full text-left block hover:bg-gray-50 p-4">
                                <div className="flex items-center space-x-4">
                                    <img className="h-12 w-12 rounded-full object-cover" src={patient.imageUrl} alt={patient.name} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-gray-900 truncate">{patient.name}</p>
                                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                         <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[patient.status] || 'bg-gray-100 text-gray-800'}`}>
                                            {patient.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-2 pl-16">
                                     <p className="text-sm text-gray-600">
                                         <span className="font-semibold">Next:</span> {patient.nextAction}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default PatientList;
