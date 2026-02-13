
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Patient, TimelineEvent } from '../../constants';

interface LabReportUploaderProps {
    patient: Patient;
    onUpdatePatient: (patientId: string | number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates: Partial<Patient>) => void;
    onClose: () => void;
}

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;

const LabReportUploader: React.FC<LabReportUploaderProps> = ({ patient, onUpdatePatient, onClose }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        // 10MB Limit
        if (file.size > 10 * 1024 * 1024) {
            setError("File size exceeds 10MB limit.");
            return;
        }

        // Check file type
        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            setError("Please upload a PDF or image file.");
            return;
        }

        setIsProcessing(true);
        setUploadStatus("Reading file...");
        setError(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async () => {
                const dataUrl = reader.result as string;
                await extractLabData(dataUrl, file.type);
            };

            reader.onerror = () => {
                setError("Failed to read file.");
                setIsProcessing(false);
            };
        } catch (err) {
            console.error(err);
            setError("Upload failed. Please try again.");
            setIsProcessing(false);
        }
    };

    const extractLabData = async (dataUrl: string, mimeType: string) => {
        setUploadStatus("Analyzing report with AI...");

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

            // Convert data URL to base64 (remove data:image/png;base64, prefix)
            const base64Data = dataUrl.split(',')[1];

            console.log('🔍 Starting extraction...', { mimeType, dataLength: base64Data.length });

            const prompt = `You are a medical lab report analyzer. Extract the following lab values from this medical report and return them in JSON format. If a value is not found, use null.

Required fields:
- hba1c (HbA1c percentage)
- fasting_insulin (Fasting Insulin in uIU/mL)
- ldl (LDL Cholesterol in mg/dL)
- apob (ApoB in mg/dL)
- lpa (Lp(a) in mg/dL)
- hscrp (hsCRP in mg/L)
- tsh (TSH in mIU/L)
- alt (ALT in U/L)
- homaIr (HOMA-IR score, calculate if fasting glucose and insulin are available)
- fasting_glucose (Fasting Glucose in mg/dL)
- hdl (HDL Cholesterol in mg/dL)
- triglycerides (Triglycerides in mg/dL)
- creatinine (Creatinine in mg/dL)

Return ONLY a valid JSON object with these fields. Extract only the numeric values without units.`;

            // Create a chat session for one-time extraction
            console.log('🤖 Creating chat session...');
            const chat = ai.chats.create({
                model: 'gemini-3-flash-preview',
                config: {
                    systemInstruction: 'You are a medical lab report analyzer. Extract data and return ONLY valid JSON.'
                }
            });

            console.log('📤 Sending message to AI...');
            // Send the message with the image/PDF
            const result = await chat.sendMessage({
                message: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimeType.includes('pdf') ? 'application/pdf' : mimeType,
                            data: base64Data
                        }
                    }
                ]
            });

            console.log('✅ Received response from AI');
            console.log('Response object:', result);

            if (!result || !result.text) {
                throw new Error('No response text received from AI');
            }

            const responseText = result.text;
            console.log('📝 Response text:', responseText.substring(0, 200));

            // Extract JSON from response (handle markdown code blocks)
            let jsonText = responseText;
            if (responseText.includes('```json')) {
                jsonText = responseText.split('```json')[1].split('```')[0].trim();
            } else if (responseText.includes('```')) {
                jsonText = responseText.split('```')[1].split('```')[0].trim();
            }

            console.log('🔧 Extracted JSON text:', jsonText.substring(0, 200));

            const labData = JSON.parse(jsonText);
            console.log('✅ Parsed lab data:', labData);

            setExtractedData(labData);
            setUploadStatus("Data extracted successfully!");
            setIsProcessing(false);

        } catch (err: any) {
            console.error('❌ AI extraction error:', err);
            console.error('Error message:', err?.message);
            console.error('Error stack:', err?.stack);

            let errorMessage = "Failed to extract data from report. ";
            if (err?.message?.includes('API key')) {
                errorMessage += "API key issue detected.";
            } else if (err?.message?.includes('JSON')) {
                errorMessage += "AI returned invalid format.";
            } else if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
                errorMessage += "Network error.";
            } else {
                errorMessage += "Please try a different file or enter data manually.";
            }

            setError(errorMessage);
            setIsProcessing(false);
        }
    };

    const handleConfirmSave = () => {
        if (!extractedData) return;

        const timelineEvent: Omit<TimelineEvent, 'id' | 'date'> = {
            type: 'Labs',
            title: 'Lab Report Uploaded',
            description: 'Metabolic health data extracted and updated from lab report.'
        };

        const updates: Partial<Patient> = {
            tracking: {
                ...patient.tracking,
                labs: extractedData
            }
        };

        onUpdatePatient(patient.id, timelineEvent, updates);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl relative animate-slide-in-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Upload Lab Report</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {!extractedData && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Upload a lab report (PDF or image) and AI will automatically extract metabolic health data.
                        </p>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,.pdf"
                            disabled={isProcessing}
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className={`w-full flex items-center justify-center gap-3 px-6 py-4 text-white bg-brand-purple rounded-xl font-semibold transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-purple/90'}`}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    {uploadStatus || 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <UploadIcon />
                                    Select Lab Report
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {extractedData && (
                    <div className="space-y-6">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <p className="text-sm font-semibold text-green-800">✓ Data extracted successfully!</p>
                            <p className="text-xs text-green-600 mt-1">Review the values below and confirm to save.</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 space-y-4 max-h-96 overflow-y-auto">
                            <h3 className="font-bold text-gray-900 mb-4">Extracted Lab Values</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(extractedData).map(([key, value]) => (
                                    <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            {key.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {value !== null ? String(value) : 'Not found'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setExtractedData(null);
                                    setUploadStatus(null);
                                }}
                                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Upload Different File
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                className="flex-1 px-6 py-3 text-white bg-brand-purple rounded-xl font-semibold hover:bg-brand-purple/90 transition-colors"
                            >
                                Confirm & Save
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            ⚠️ This will replace all existing metabolic health data
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabReportUploader;
