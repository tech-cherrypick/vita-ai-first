import React from 'react';
import { MedicalReport } from '../../constants';

interface MedicalReportsProps {
    reports: MedicalReport[];
}

const MedicalReports: React.FC<MedicalReportsProps> = ({ reports }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Medical Reports</h2>
            <ul className="space-y-4">
                {reports.map(report => (
                    <li key={report.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-800">{report.name}</p>
                            <time className="text-xs text-gray-500">{report.date}</time>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{report.summary}</p>
                        <button className="text-sm font-semibold text-brand-purple hover:underline mt-3">View Details</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MedicalReports;