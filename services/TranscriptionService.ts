import { GoogleGenAI } from '@google/genai';

const buildAudioPrompt = (recorderRole: 'doctor' | 'patient') => {
    const localSpeaker = recorderRole === 'doctor' ? 'Doctor' : 'Patient';
    const remoteSpeaker = recorderRole === 'doctor' ? 'Patient' : 'Doctor';

    return `You are a medical scribe. You will receive an audio recording of a doctor-patient consultation.

This audio was recorded from the ${localSpeaker}'s device. The ${localSpeaker}'s voice will typically be louder/clearer, and the ${remoteSpeaker}'s voice may be slightly quieter or have a different audio quality since it comes through the call.

Please perform TWO tasks:

TASK 1 - SUMMARY:
Provide a structured summary with:
- Key Takeaways
- Potential Diagnosis/Points discussed
- Recommended Next Steps

TASK 2 - TRANSCRIPT:
Provide a full transcript in readable dialog format. Label speakers as "**Doctor:**" and "**Patient:**". Use the audio quality hint above to distinguish between speakers.

Please separate the two sections clearly with the strict delimiter: "|||TRANSCRIPT_START|||"
`;
};

const SUPPORTED_MIME_TYPES = [
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/wav',
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm'
];

const GEMINI_MIME_MAP: Record<string, string> = {
    'audio/ogg;codecs=opus': 'audio/ogg',
    'audio/ogg': 'audio/ogg',
    'audio/wav': 'audio/wav',
    'audio/mp4': 'audio/aac',
    'audio/webm;codecs=opus': 'audio/wav',
    'audio/webm': 'audio/wav'
};

export interface TranscriptionResult {
    summary: string;
    formattedTranscript: string;
}

class TranscriptionService {
    private recorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private recording = false;
    private selectedMimeType = '';

    start(stream: MediaStream): boolean {
        try {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                console.error('[TranscriptionService] No audio tracks found in stream');
                return false;
            }

            const audioOnlyStream = new MediaStream(audioTracks);
            console.log(`[TranscriptionService] Created audio-only stream with ${audioTracks.length} track(s)`);

            this.selectedMimeType = SUPPORTED_MIME_TYPES.find(
                mt => MediaRecorder.isTypeSupported(mt)
            ) || '';

            if (!this.selectedMimeType) {
                console.error('[TranscriptionService] No supported audio MIME type found');
                return false;
            }

            console.log('[TranscriptionService] Recording with MIME:', this.selectedMimeType);

            this.recorder = new MediaRecorder(audioOnlyStream, { mimeType: this.selectedMimeType });
            this.chunks = [];

            this.recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.chunks.push(event.data);
                    console.log(`[TranscriptionService] Chunk captured: ${event.data.size} bytes (total chunks: ${this.chunks.length})`);
                }
            };

            this.recorder.onerror = (event) => {
                console.error('[TranscriptionService] MediaRecorder error:', event);
            };

            this.recorder.start(3000);
            this.recording = true;
            console.log('[TranscriptionService] Recording started');
            return true;
        } catch (error) {
            console.error('[TranscriptionService] Failed to start recording:', error);
            return false;
        }
    }

    stopAndGetBlob(): Promise<Blob | null> {
        console.log(`[TranscriptionService] stopAndGetBlob called. recording=${this.recording}, chunks=${this.chunks.length}`);

        return new Promise((resolve) => {
            if (!this.recorder || !this.recording) {
                const blob = this.chunks.length > 0 ? new Blob(this.chunks, { type: this.selectedMimeType || 'audio/ogg' }) : null;
                console.log(`[TranscriptionService] Recorder not active. Returning blob: ${blob?.size || 0} bytes`);
                resolve(blob);
                return;
            }

            this.recorder.onstop = () => {
                this.recording = false;
                const blob = this.chunks.length > 0 ? new Blob(this.chunks, { type: this.selectedMimeType || 'audio/ogg' }) : null;
                console.log(`[TranscriptionService] Recorder stopped. Final blob: ${blob?.size || 0} bytes, chunks: ${this.chunks.length}`);
                resolve(blob);
            };

            this.recorder.stop();
        });
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

    private static parseResponse(responseText: string): TranscriptionResult {
        const parts = responseText.split('|||TRANSCRIPT_START|||');
        return {
            summary: parts[0]?.trim() || 'Summary could not be parsed from AI response.',
            formattedTranscript: parts[1]?.trim() || ''
        };
    }

    static async generateSummary(audioBlob: Blob | null, recorderRole: 'doctor' | 'patient' = 'doctor'): Promise<TranscriptionResult> {
        const apiKey = import.meta.env.VITE_API_KEY;
        if (!apiKey) {
            console.error('[TranscriptionService] VITE_API_KEY is missing');
            return { summary: 'Summary generation failed: API key missing.', formattedTranscript: '' };
        }

        if (!audioBlob || audioBlob.size < 1000) {
            console.warn(`[TranscriptionService] Audio blob too small or null: ${audioBlob?.size || 0} bytes`);
            return { summary: 'No significant conversation recorded.', formattedTranscript: '' };
        }

        const geminiMimeType = GEMINI_MIME_MAP[audioBlob.type] || 'audio/ogg';
        console.log(`[TranscriptionService] Sending to Gemini. Blob type: ${audioBlob.type}, Gemini MIME: ${geminiMimeType}, size: ${audioBlob.size}`);

        try {
            const genAI = new GoogleGenAI({ apiKey });
            const base64Audio = await TranscriptionService.blobToBase64(audioBlob);
            console.log(`[TranscriptionService] Base64 audio length: ${base64Audio.length}`);

            const response = await genAI.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [
                    { text: buildAudioPrompt(recorderRole) },
                    { inlineData: { mimeType: geminiMimeType, data: base64Audio } }
                ]
            });

            const responseText = response.text || '';
            console.log(`[TranscriptionService] Gemini response length: ${responseText.length}`);

            if (!responseText) {
                console.warn('[TranscriptionService] Empty response from Gemini');
                return { summary: 'Failed to parse AI response.', formattedTranscript: '' };
            }

            return TranscriptionService.parseResponse(responseText);
        } catch (error) {
            console.error('[TranscriptionService] Gemini API error:', error);
            return {
                summary: `Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                formattedTranscript: ''
            };
        }
    }

    static async saveToBackend(patientId: string, transcript: string, summary: string): Promise<void> {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        console.log(`[TranscriptionService] Saving to backend for patient: ${patientId}`);

        const response = await fetch(`${API_BASE_URL}/api/consultation/save-transcript`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId, transcript, summary })
        });

        const result = await response.json();
        console.log(`[TranscriptionService] Backend save response:`, result);

        if (!response.ok) {
            throw new Error(`Backend save failed: ${response.status}`);
        }
    }
}

export default TranscriptionService;

