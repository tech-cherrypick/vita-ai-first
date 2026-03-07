import { GoogleGenAI } from '@google/genai';

const SUMMARY_PROMPT = `You are a medical scribe. Analyze the following raw continuous speech transcript from a consultation. 
Please perform TWO tasks:
TASK 1: Provide a structured summary with:
- Key Takeaways
- Potential Diagnosis/Points discussed
- Recommended Next Steps

TASK 2: Reformat the raw transcript into a readable dialog format with clear speaker labels (e.g., Doctor: "...", Patient: "..."). Infer the speakers based on the context.

Please separate the two sections clearly with the strict delimiter: "|||TRANSCRIPT_START|||"

RAW TRANSCRIPT:
`;

export interface TranscriptionResult {
    summary: string;
    formattedTranscript: string;
}

class TranscriptionService {
    private recognition: any = null;
    private transcript = '';
    private onUpdate: (transcript: string) => void;

    constructor(onUpdate: (transcript: string) => void) {
        this.onUpdate = onUpdate;
    }

    start(): boolean {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return false;

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            this.transcript = finalTranscript.trim();
            this.onUpdate(finalTranscript + interimTranscript);
        };

        this.recognition.onerror = () => {};
        this.recognition.start();
        return true;
    }

    stop(): void {
        this.recognition?.stop();
        this.recognition = null;
    }

    getTranscript(): string {
        return this.transcript;
    }

    static async generateSummary(transcript: string): Promise<TranscriptionResult> {
        if (!transcript || transcript.trim().length < 10) {
            return {
                summary: 'No significant conversation recorded for summarization.',
                formattedTranscript: transcript
            };
        }

        const apiKey = import.meta.env.VITE_API_KEY;
        if (!apiKey) {
            return {
                summary: 'Summary generation failed: API key missing.',
                formattedTranscript: transcript
            };
        }

        try {
            const genAI = new GoogleGenAI({ apiKey });
            const chat = genAI.chats.create({ model: 'gemini-2.0-flash' });
            const result = await chat.sendMessage({ message: SUMMARY_PROMPT + transcript });

            let responseText = '';
            const anyResult = result as any;
            if (typeof anyResult.text === 'string') {
                responseText = anyResult.text;
            } else if (anyResult.response && typeof anyResult.response.text === 'function') {
                responseText = await anyResult.response.text();
            } else if (anyResult.text && typeof anyResult.text === 'function') {
                responseText = await anyResult.text();
            }

            if (!responseText) {
                return { summary: 'Failed to parse response.', formattedTranscript: transcript };
            }

            const parts = responseText.split('|||TRANSCRIPT_START|||');
            return {
                summary: parts[0]?.trim() || 'Summary could not be parsed from AI response.',
                formattedTranscript: parts[1]?.trim() || transcript
            };
        } catch (error) {
            return {
                summary: `Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                formattedTranscript: transcript
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

