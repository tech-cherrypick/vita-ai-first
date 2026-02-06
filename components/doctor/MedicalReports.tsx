
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

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !patientId || !onUpdatePatient) return;

        const file = e.target.files[0];
        setIsUploading(true);
        setUploadStatus("Reading file...");

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                setUploadStatus("Analyzing with Gemini...");

                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

                const prompt = `Analyze this medical lab report image. Extract all distinct lab results found.
                Return a valid JSON object with a key 'results' which is an array of objects.
                Do not include markdown formatting (like \`\`\`json). Just return the raw JSON string.
                
                Each object in 'results' must have:
                - 'name' (e.g. HbA1c, LDL Cholesterol, TSH, ALT)
                - 'value' (e.g. 5.7, 120)
                - 'range' (the reference range provided, e.g. < 5.7)
                - 'status' (interpret as 'High', 'Low', 'Normal' based on the range)
                - 'category' (Infer one of: 'Glycemic Control', 'Lipid Panel', 'Inflammation', 'Organ Function', 'Hormonal', 'Other')
                
                If the image is not a lab report, return {"results": []}.`;

                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.0-flash-exp', // Use latest stable or exp
                        contents: {
                            parts: [
                                { inlineData: { mimeType: file.type, data: base64Data } },
                                { text: prompt }
                            ]
                        }
                    });

                    let jsonText = response.text || "{}";
                    jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();

                    let newResults: LabResult[] = [];
                    try {
                        const data = JSON.parse(jsonText);
                        newResults = data.results || [];
                    } catch (parseError) {
                        console.error("JSON Parse Error", parseError);
                    }

                    const newReport: MedicalReport = {
                        id: `r_${Date.now()}`,
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        date: new Date().toLocaleDateString(),
                        summary: file.name,
                        parsedResults: newResults
                    };

                    const timelineEvent: Omit<TimelineEvent, 'id' | 'date'> = {
                        type: 'Labs',
                        title: 'Lab Report Uploaded',
                        description: `New report uploaded: ${newReport.name}. ${newResults.length} data points synced.`
                    };

                    onUpdatePatient(patientId, timelineEvent, {
                        reports: [newReport, ...reports],
                        // status: 'Ready for Consult', // Don't override main status here unless strictly needed
                        // nextAction: 'Review New Labs'
                    });
                    setUploadStatus("Success! Dashboard Updated.");

                } catch (apiError) {
                    console.error("Gemini API Error", apiError);
                    setUploadStatus("AI Analysis failed. Report uploaded without data parsing.");
                    const newReport: MedicalReport = {
                        id: `r_${Date.now()}`,
                        name: file.name,
                        date: new Date().toLocaleDateString(),
                        summary: file.name
                    };
                    onUpdatePatient(patientId, {
                        type: 'Labs', title: 'File Uploaded', description: 'Manual upload.'
                    }, {
                        reports: [newReport, ...reports],
                        status: 'Ready for Consult',
                        nextAction: 'Review New Labs'
                    });
                }

                setTimeout(() => {
                    setIsUploading(false);
                    setUploadStatus(null);
                }, 2500);
            };
        } catch (e) {
            console.error(e);
            setIsUploading(false);
            setUploadStatus("Upload failed");
        }
    };

    const handleDeleteReport = (reportId: string) => {
        if (!patientId || !onUpdatePatient) return;

        const updatedReports = reports.filter(r => r.id !== reportId);
        const latestReportWithData = updatedReports.find(r => r.parsedResults && r.parsedResults.length > 0);
        const nextLabResults = latestReportWithData ? latestReportWithData.parsedResults : [];

        const timelineEvent: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Note',
            title: 'Report Deleted',
            description: 'Medical report removed from patient record.'
        };

        onUpdatePatient(patientId, timelineEvent, {
            reports: updatedReports,
            labResults: nextLabResults
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
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
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isUploading ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <UploadIcon />
                        )}
                        {isUploading ? 'Processing...' : 'Upload'}
                    </button>
                </div>
            </div>

            {uploadStatus && (
                <div className={`mb-4 p-2 rounded text-xs font-semibold text-center ${uploadStatus.includes("Success") ? 'bg-green-50 text-green-700' : 'bg-brand-purple/5 text-brand-purple'}`}>
                    {uploadStatus}
                </div>
            )}

            <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {reports.map(report => (
                    <li key={report.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow relative group">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-800">{report.name}</p>
                            <div className="flex items-center gap-2">
                                <time className="text-xs text-gray-500">{report.date}</time>
                                <button
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="p-1 rounded hover:bg-red-50 transition-colors group-hover:opacity-100 md:opacity-0 opacity-100"
                                    title="Delete Report"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{report.summary}</p>
                        <button className="text-sm font-semibold text-brand-purple hover:underline mt-3">View Details</button>
                    </li>
                ))}
                {reports.length === 0 && <li className="text-sm text-gray-400 text-center py-4">No reports uploaded yet.</li>}
            </ul>
        </div>
    );
};

export default MedicalReports;
