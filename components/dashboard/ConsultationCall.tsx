import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../socket';
import { GoogleGenAI } from '@google/genai';

interface ConsultationCallProps {
    onCallEnd: (data?: { transcript: string; summary: string }) => void;
    otherPartyName: string;
    patientId: string;
    role: 'doctor' | 'patient';
}

const ConsultationCall: React.FC<ConsultationCallProps> = ({ onCallEnd, otherPartyName, patientId, role }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const transcriptRef = useRef<string>('');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [summary, setSummary] = useState<string>('');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const recognitionRef = useRef<any>(null);
    const socket = getSocket();

    // --- Media & WebRTC Setup ---
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Signaling logic for WebRTC would go here (offer/answer/candidates)
                // For this demo, we'll simulate the "Remote" connection but keep the signaling infrastructure
                socket.emit('join_room', patientId);

                // Listen for signals
                socket.on('signal', (data: any) => {
                    console.log('Received signal:', data);
                    // Actual WebRTC logic would process signalData here
                });

                socket.on('call_ended', () => {
                    handleEndCall();
                });

            } catch (err) {
                console.error("Error accessing camera: ", err);
                // Instead of a hard error, we provide a "Medical Profile" fallback
                // to keep the premium feel even if permissions are denied.
                setError(null);
                setIsVideoOff(true);
            }
        };

        startCamera();
        startTranscription();

        return () => {
            stopTranscription();
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                const stream = localVideoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            socket.off('signal');
            socket.off('call_ended');
        };
    }, [patientId]);

    const toggleMic = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            stream.getAudioTracks().forEach(track => {
                const newStatus = !track.enabled;
                track.enabled = newStatus;
                setIsMuted(!newStatus);
            });
        }
    };

    const toggleVideo = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            stream.getVideoTracks().forEach(track => {
                const newStatus = !track.enabled;
                track.enabled = newStatus;
                setIsVideoOff(!newStatus);
            });
        }
    };

    // --- Transcription Logic ---
    const startTranscription = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                const newTranscript = transcriptRef.current + ' ' + currentTranscript;
                transcriptRef.current = newTranscript;

                // Slightly debounce / throttle UI updates if needed, but for now state update is fine
                // since transcript is typically short.
                setTranscript(newTranscript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
            };

            recognition.start();
            recognitionRef.current = recognition;
            setIsTranscribing(true);
        }
    };

    const stopTranscription = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsTranscribing(false);
        }
    };

    const generateSummary = async (fullTranscript: string) => {
        if (!fullTranscript || fullTranscript.trim().length < 10) {
            return "No significant conversation recorded for summarization.";
        }
        try {
            const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
            // Using the pattern found in PatientLive.tsx for this version of the SDK
            const chat = genAI.chats.create({ model: 'gemini-1.5-flash' });
            const result = await chat.sendMessage({ message: `Summarize this medical consultation transcript into key takeaways, diagnosis, and next steps: \n\n${fullTranscript}` });
            return result.text;
        } catch (error) {
            console.error("Error generating summary:", error);
            return "Summary generation failed.";
        }
    };

    const handleEndCall = async () => {
        stopTranscription();
        socket.emit('end_call', { patientId, senderRole: role });

        const currentTranscript = transcriptRef.current;
        console.log("Ending call with transcript length:", currentTranscript.length);

        // Finalize transcript and summary
        const finalSummary = await generateSummary(currentTranscript);
        setSummary(finalSummary);

        // Save to backend
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
            console.log("Attempting to save transcript to:", `${API_BASE_URL}/api/consultation/save-transcript`);
            const response = await fetch(`${API_BASE_URL}/api/consultation/save-transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    transcript: currentTranscript,
                    summary: finalSummary,
                    role
                })
            });
            const result = await response.json();
            console.log("Full save results from backend:", result);
        } catch (e) {
            console.error("Failed to save transcript to backend", e);
        }

        onCallEnd({ transcript: currentTranscript, summary: finalSummary });
    };

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            <div className="flex-1 relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 min-h-[400px]">
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Session</span>
                    </div>
                    {isTranscribing && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-purple/40 backdrop-blur-md rounded-full border border-brand-purple/20 animate-fade-in">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-cyan">Transcribing...</span>
                        </div>
                    )}
                </div>
                {/* Main Video (Simulated Remote) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <img
                        src={role === 'doctor'
                            ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop"
                            : "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop"}
                        alt="Other party"
                        className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                    <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                        <span className="text-white font-bold text-sm tracking-wide">{otherPartyName}</span>
                    </div>
                </div>

                {/* Local Video Overlay */}
                <div className="absolute bottom-6 right-6 w-1/4 aspect-[3/4] bg-gray-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 group">
                    {error ? (
                        <div className="w-full h-full flex items-center justify-center text-center text-[10px] text-white p-4 bg-gray-800">
                            {error}
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            {/* Always keep video in DOM, just hide it with CSS */}
                            <video
                                ref={localVideoRef}
                                className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0 absolute inset-0' : 'opacity-100'}`}
                                autoPlay
                                playsInline
                                muted
                            ></video>

                            {/* Fallback View (Shown when isVideoOff is true) */}
                            <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-700 transition-opacity duration-300 ${isVideoOff ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] text-white/60 font-medium font-serif italic">Camera Off</span>
                            </div>

                            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-bold border border-white/10">YOU</div>
                        </div>
                    )}
                </div>

                {/* Real-time Transcription Overlay */}
                <div className="absolute bottom-6 left-6 right-[35%] bg-black/50 backdrop-blur-xl p-5 rounded-2xl border border-white/10 max-h-[140px] overflow-y-auto custom-scrollbar shadow-xl transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-ping"></div>
                        <span className="text-brand-cyan font-black uppercase text-[10px] tracking-widest">Live Metadata Transcription</span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed font-medium">
                        {transcript || (isTranscribing ? "Calibrating voice recognition and listening to audio stream..." : "Waiting for speech signal...")}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex justify-center items-center gap-6">
                <button
                    onClick={toggleMic}
                    className={`w-16 h-16 rounded-full border transition-all shadow-md group flex items-center justify-center ${isMuted ? 'bg-red-500 border-red-400 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={handleEndCall}
                    className="px-12 h-16 bg-red-500 rounded-full flex items-center justify-center text-white font-black gap-3 shadow-xl shadow-red-500/30 hover:bg-red-600 transition-all hover:scale-105 active:scale-95 border border-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2 2m-2-2v5l-5 5H3a2 2 0 01-2-2V8a2 2 0 012-2h3l2-4h4l2 4h3a2 2 0 012 2z" />
                    </svg>
                    End Session
                </button>

                <button
                    onClick={toggleVideo}
                    className={`w-16 h-16 rounded-full border transition-all shadow-md group flex items-center justify-center ${isVideoOff ? 'bg-red-500 border-red-400 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    {isVideoOff ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ConsultationCall;
