import { GoogleGenAI } from '@google/genai';

const AUDIO_PROMPT = `You are a medical scribe. You will receive an audio recording of a doctor-patient consultation.

Please perform TWO tasks:

TASK 1: Provide a structured summary with:
- Key Takeaways
- Potential Diagnosis/Points discussed
- Recommended Next Steps

TASK 2: Provide a full transcript in readable dialog format with clear speaker labels (e.g., Doctor: "...", Patient: "..."). Infer the speakers based on the context.

Please separate the two sections clearly with the strict delimiter: "|||TRANSCRIPT_START|||"
`;


export interface TranscriptionResult {
    summary: string;
    formattedTranscript: string;
}

class TranscriptionService {
    private recorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private recording = false;

    start(stream: MediaStream): boolean {
        try {
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            this.recorder = new MediaRecorder(stream, { mimeType });
            this.chunks = [];

            this.recorder.ondataavailable = (event) => {
                if (event.data.size > 0) this.chunks.push(event.data);
            };

            this.recorder.start(5000);
            this.recording = true;
            return true;
        } catch {
            return false;
        }
    }

    stop(): void {
        if (this.recorder && this.recording) {
            this.recorder.stop();
            this.recording = false;
        }
    }

    getAudioBlob(): Blob | null {
        if (this.chunks.length === 0) return null;
        return new Blob(this.chunks, { type: 'audio/webm' });
    }

    private static async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    private static parseResponse(responseText: string, fallback: string): TranscriptionResult {
        const parts = responseText.split('|||TRANSCRIPT_START|||');
        return {
            summary: parts[0]?.trim() || 'Summary could not be parsed from AI response.',
            formattedTranscript: parts[1]?.trim() || fallback
        };
    }

    static async generateSummary(audioBlob: Blob | null): Promise<TranscriptionResult> {
        const apiKey = import.meta.env.VITE_API_KEY;
        if (!apiKey) {
            return { summary: 'Summary generation failed: API key missing.', formattedTranscript: '' };
        }

        if (!audioBlob || audioBlob.size < 1000) {
            return { summary: 'No significant conversation recorded.', formattedTranscript: '' };
        }

        try {
            const genAI = new GoogleGenAI({ apiKey });
            const base64Audio = await TranscriptionService.blobToBase64(audioBlob);

            const response = await genAI.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{
                    role: 'user',
                    parts: [
                        { text: AUDIO_PROMPT },
                        { inlineData: { mimeType: 'audio/webm', data: base64Audio } }
                    ]
                }]
            });

            const responseText = response.text || '';
            if (!responseText) {
                return { summary: 'Failed to parse AI response.', formattedTranscript: '' };
            }
            return TranscriptionService.parseResponse(responseText, '');
        } catch (error) {
            return {
                summary: `Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                formattedTranscript: ''
            };
        }
    }

    static async saveToBackend(patientId: string, transcript: string, summary: string): Promise<void> {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        await fetch(`${API_BASE_URL}/api/consultation/save-transcript`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId, transcript, summary })
        });
    }
}

export default TranscriptionService;

