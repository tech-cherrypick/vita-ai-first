
import React, { useState, useRef } from 'react';
import { MedicalReport, Patient, TimelineEvent, LabResult } from '../../constants';
import { GoogleGenAI } from "@google/genai";

interface MedicalReportsProps {
    reports: MedicalReport[];
    patientId?: string | number;
    onUpdatePatient?: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
}

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const MedicalReports: React.FC<MedicalReportsProps> = ({ reports, patientId, onUpdatePatient }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !patientId || !onUpdatePatient) return;

        const file = e.target.files[0];

        // 10MB Limit
        if (file.size > 10 * 1024 * 1024) {
            setUploadStatus("Error: File size exceeds 10MB limit.");
            setTimeout(() => setUploadStatus(null), 3000);
            return;
        }

        setIsUploading(true);
        setUploadStatus("Processing...");

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async () => {
                const dataUrl = reader.result as string;
                const fileType = file.type.includes('pdf') ? 'pdf' : 'image';

                const newReport: MedicalReport = {
                    id: `r_${Date.now()}`,
                    name: file.name,
                    date: new Date().toLocaleDateString(),
                    summary: `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                    url: dataUrl,
                    type: fileType as any,
                    fileSize: file.size
                };

                const timelineEvent: Omit<TimelineEvent, 'id' | 'date'> = {
                    type: 'Labs',
                    title: 'Medical Report Uploaded',
                    description: `New report uploaded: ${newReport.name}.`
                };

                // Propagate to App.tsx
                onUpdatePatient(patientId, timelineEvent, {
                    reports: [newReport, ...reports]
                });

                setUploadStatus("Success! Uploaded.");
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadStatus(null);
                }, 2000);
            };
        } catch (e) {
            console.error(e);
            setIsUploading(false);
            setUploadStatus("Upload failed");
        }
    };

    const handleDeleteReport = (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!patientId || !onUpdatePatient) return;

        const updatedReports = reports.filter(r => r.id !== reportId);
        onUpdatePatient(patientId, null, { reports: updatedReports });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Medical Reports</h2>
                <div className="relative">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf"
                    />
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-purple bg-brand-purple/10 rounded-xl hover:bg-brand-purple/20 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isUploading ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <UploadIcon />
                        )}
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>

            {uploadStatus && (
                <div className={`mb-4 p-3 rounded-xl text-xs font-semibold text-center ${uploadStatus.includes("Error") ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {uploadStatus}
                </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-[200px] pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {reports.map(report => (
                        <div
                            key={report.id}
                            onClick={() => setSelectedReport(report)}
                            className="aspect-square bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative group cursor-pointer hover:border-brand-purple transition-all"
                        >
                            {report.type === 'pdf' ? (
                                <div className="h-full flex flex-col items-center justify-center p-2 text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    <p className="text-[10px] font-bold text-gray-700 truncate w-full px-1">{report.name}</p>
                                </div>
                            ) : (
                                <img src={report.url} alt={report.name} className="h-full w-full object-cover" />
                            )}

                            {/* Overlay info */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <p className="text-[10px] text-white font-medium truncate">{report.name}</p>
                                <p className="text-[8px] text-white/80">{report.date}</p>
                            </div>

                            <button
                                onClick={(e) => handleDeleteReport(report.id, e)}
                                className="absolute top-1 right-1 p-1.5 bg-white/90 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                    {reports.length === 0 && (
                        <div className="col-span-full h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                            <p className="text-sm">No reports uploaded yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Screen Viewer Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in">
                    <header className="p-4 flex justify-between items-center text-white border-b border-white/10">
                        <div>
                            <h3 className="font-bold">{selectedReport.name}</h3>
                            <p className="text-xs text-white/60">{selectedReport.date} • {selectedReport.summary}</p>
                        </div>
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </header>
                    <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
                        {selectedReport.type === 'pdf' ? (
                            <iframe
                                src={selectedReport.url}
                                className="w-full h-full rounded-xl bg-white"
                                title={selectedReport.name}
                            />
                        ) : (
                            <img
                                src={selectedReport.url}
                                alt={selectedReport.name}
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalReports;
