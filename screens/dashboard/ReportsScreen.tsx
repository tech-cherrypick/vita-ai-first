
import React from 'react';
import { Patient } from '../../constants';
import HealthMetricsDashboard from '../../components/HealthMetricsDashboard';

interface ReportsScreenProps {
    patient?: Patient;
}

const ScreenHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold tracking-tighter text-brand-text">{title}</h2>
        <p className="mt-2 text-lg text-brand-text-light max-w-2xl mx-auto">{subtitle}</p>
    </div>
);

const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

const mockReports = [
    { name: "3-Month Progress Summary", date: "September 5, 2024" },
    { name: "Evolv Nutrition Guide", date: "June 18, 2024" },
    { name: "Initial Consultation Summary", date: "June 18, 2024" },
    { name: "Comprehensive Blood Panel Results", date: "June 10, 2024" },
];

const ReportsScreen: React.FC<ReportsScreenProps> = ({ patient }) => {
    return (
        <div>
            <ScreenHeader title="Reports & Data" subtitle="Access your health metrics, lab results, and progress reports." />
            
            <div className="max-w-5xl mx-auto space-y-10">
                {/* Reports Modules Stack */}
                {patient && (
                    <section className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-xl font-bold text-brand-text">My Health Profile</h3>
                            <span className="px-2 py-1 bg-brand-cyan/10 text-brand-cyan text-xs font-bold rounded-full uppercase">Live Data</span>
                        </div>
                        <HealthMetricsDashboard patient={patient} />
                    </section>
                )}

                {/* Downloadable Documents Section */}
                <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <h3 className="text-xl font-bold text-brand-text mb-6">Documents & Downloads</h3>
                    <div className="space-y-4">
                        {mockReports.map((report, index) => (
                            <div key={index} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between transition-shadow hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className="bg-brand-purple/10 p-3 rounded-lg">
                                        <DocumentIcon />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-brand-text">{report.name}</h3>
                                        <p className="text-sm text-brand-text-light">{report.date}</p>
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition-colors">
                                    <DownloadIcon />
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ReportsScreen;
