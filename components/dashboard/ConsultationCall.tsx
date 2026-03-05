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
    const [isPartnerJoined, setIsPartnerJoined] = useState(false);
    const [isLocalTalking, setIsLocalTalking] = useState(false);
    const [remoteRole, setRemoteRole] = useState<string | null>(null);
    const [isRemoteMuted, setIsRemoteMuted] = useState(false);
    const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
    const [isRemoteTalking, setIsRemoteTalking] = useState(false);

    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socket = getSocket();

    // --- Media & WebRTC Setup ---
    useEffect(() => {
        let stream: MediaStream | null = null;
        let pc: RTCPeerConnection | null = null;

        const initPeerConnection = (localStream: MediaStream) => {
            pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            localStream.getTracks().forEach(track => {
                pc?.addTrack(track, localStream);
            });

            pc.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('webrtc_signal', { patientId, role, signalData: { candidate: event.candidate } });
                }
            };

            peerConnectionRef.current = pc;
            return pc;
        };

        const handleJoinCallRoom = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setupVoiceActivityDetection(stream);
                initPeerConnection(stream);
            } catch (err) {
                console.error("Error accessing camera: ", err);
                setError(null);
                setIsVideoOff(true);
                // Create an empty peer connection even without camera so we can receive their video
                initPeerConnection(new MediaStream());
            }

            // Immediately register to the room once local prep is done
            socket.emit('join_call_room', { patientId, role });
        };

        handleJoinCallRoom();
        startTranscription();

        // Listen for Partner Joining (Caller initiates offer)
        socket.on('user_joined_call', async (data: any) => {
            console.log('Other user joined call:', data);
            setIsPartnerJoined(true);
            setRemoteRole(data.role);

            // Let the 'doctor' role be the polite caller that initiates the WebRTC offer
            if (role === 'doctor' && peerConnectionRef.current) {
                try {
                    const pc = peerConnectionRef.current;
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('webrtc_signal', { patientId, role, signalData: { offer } });
                } catch (e) {
                    console.error("Error creating WebRTC offer:", e);
                }
            }
        });

        socket.on('user_left_call', (data: any) => {
            console.log('Other user left call:', data);
            setIsPartnerJoined(false);
            setRemoteStream(null);
            setIsRemoteMuted(false);
            setIsRemoteVideoOff(false);
            setIsRemoteTalking(false);
        });

        socket.on('webrtc_signal', async (data: any) => {
            if (data.role !== role && peerConnectionRef.current) {
                const pc = peerConnectionRef.current;
                const { signalData } = data;
                try {
                    if (signalData.offer) {
                        await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit('webrtc_signal', { patientId, role, signalData: { answer } });
                    } else if (signalData.answer) {
                        await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
                    } else if (signalData.candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                    }
                } catch (e) {
                    console.error("WebRTC Error:", e);
                }
            }
        });

        socket.on('media_status_changed', (data: any) => {
            if (data.role !== role) {
                setIsRemoteMuted(data.isMuted);
                setIsRemoteVideoOff(data.isVideoOff);
            }
        });

        socket.on('speaking_status_changed', (data: any) => {
            if (data.role !== role) {
                setIsRemoteTalking(data.isSpeaking);
            }
        });

        socket.on('call_ended', () => {
            handleEndCall();
        });

        return () => {
            stopTranscription();
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            socket.emit('leave_call_room', { patientId, role });
            socket.off('call_ended');
            socket.off('user_joined_call');
            socket.off('user_left_call');
            socket.off('webrtc_signal');
            socket.off('media_status_changed');
            socket.off('speaking_status_changed');
        };
    }, [patientId]);

    // Broadcast our media state whenever it changes
    useEffect(() => {
        socket.emit('media_status_changed', { patientId, role, isMuted, isVideoOff });
    }, [isMuted, isVideoOff, patientId, role, socket]);

    // Broadcast our speaking state whenever it changes
    useEffect(() => {
        socket.emit('speaking_status_changed', { patientId, role, isSpeaking: isLocalTalking });
    }, [isLocalTalking, patientId, role, socket]);

    const setupVoiceActivityDetection = (stream: MediaStream) => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            checkVoiceLevel();
        } catch (e) {
            console.error("Failed to setup voice activity detection:", e);
        }
    };

    const checkVoiceLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Threshold for talking
        setIsLocalTalking(average > 15);

        animationFrameRef.current = requestAnimationFrame(checkVoiceLevel);
    };

    const toggleMic = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            const newMutedState = !isMuted;
            stream.getAudioTracks().forEach(track => {
                track.enabled = !newMutedState;
            });
            setIsMuted(newMutedState);
        }
    };

    const toggleVideo = async () => {
        if (!localVideoRef.current) return;

        if (!isVideoOff) {
            // Turning video OFF: stop the hardware track completely
            if (localVideoRef.current.srcObject) {
                const stream = localVideoRef.current.srcObject as MediaStream;
                stream.getVideoTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
            }
            setIsVideoOff(true);
        } else {
            // Turning video ON: request a new video track from hardware
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];

                if (localVideoRef.current.srcObject) {
                    const currentStream = localVideoRef.current.srcObject as MediaStream;
                    currentStream.getVideoTracks().forEach(t => currentStream.removeTrack(t));
                    currentStream.addTrack(newVideoTrack);
                    // Force the video element to update
                    localVideoRef.current.srcObject = currentStream;
                } else {
                    localVideoRef.current.srcObject = newStream;
                }

                setIsVideoOff(false);
            } catch (err) {
                console.error("Failed to re-enable camera:", err);
            }
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
            console.warn("Transcript too short for summarization. Length:", fullTranscript?.length);
            return "No significant conversation recorded for summarization.";
        }

        const apiKey = import.meta.env.VITE_API_KEY;
        if (!apiKey) {
            console.error("VITE_API_KEY is missing. Summary cannot be generated.");
            return "Summary generation failed: API key missing.";
        }

        try {
            const genAI = new GoogleGenAI({ apiKey });
            // Using gemini-2.0-flash for better summarization as per PatientLive.tsx
            const chat = genAI.chats.create({ model: 'gemini-2.0-flash' });

            const prompt = `You are a medical scribe. Analyze the following consultation transcript and provide a structured summary with:
1. Key Takeaways
2. Potential Diagnosis/Points discussed
3. Recommended Next Steps

TRANSCRIPT:
${fullTranscript}`;

            const result = await chat.sendMessage({ message: prompt });
            // Reliable text extraction for @google/genai ^0.2.0
            let summaryText = "";
            const anyResult = result as any;
            if (typeof anyResult.text === 'string') {
                summaryText = anyResult.text;
            } else if (anyResult.response && typeof anyResult.response.text === 'function') {
                summaryText = await anyResult.response.text();
            } else if (anyResult.text && typeof anyResult.text === 'function') {
                summaryText = await anyResult.text();
            }

            return summaryText || "Summary could not be parsed from AI response.";
        } catch (error) {
            console.error("Error generating summary with Gemini:", error);
            return `Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
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

        // Save to backend - ONLY DOCTOR SAVES TO PREVENT DUPLICATES
        if (role === 'doctor') {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
        } else {
            console.log("Patient role detected, skipping backend save (Doctor handles this).");
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
                    {!isPartnerJoined ? (
                        <div className="flex flex-col items-center justify-center gap-4 z-10 p-8">
                            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center animate-pulse shadow-xl border border-gray-700">
                                <svg className="w-10 h-10 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-wide">Waiting for {role === 'doctor' ? 'patient' : 'physician'} to join...</h3>
                            <p className="text-sm text-gray-400">They will appear here once they connect to the session.</p>
                        </div>
                    ) : (
                        <>
                            {remoteStream && !isRemoteVideoOff ? (
                                <video
                                    autoPlay
                                    playsInline
                                    className={`w-full h-full object-cover transition-opacity duration-500`}
                                    ref={(ref) => {
                                        if (ref && remoteStream) {
                                            ref.srcObject = remoteStream;
                                        }
                                    }}
                                />
                            ) : (
                                <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-800 transition-opacity duration-500`}>
                                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 border-2 border-gray-600 shadow-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-400 font-medium">Camera Off</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
                            <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg">
                                {isRemoteMuted ? (
                                    <div className={`w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)]`} title="Muted">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2.5" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className={`w-3 h-3 rounded-full ${isRemoteTalking ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-gray-400'}`}></div>
                                )}
                                <span className="text-white font-bold text-sm tracking-wide">{otherPartyName || 'Participant'}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Local Video Overlay */}
                <div className={`absolute bottom-6 right-6 w-1/4 max-w-[200px] aspect-[3/4] bg-gray-800 rounded-2xl overflow-hidden border-2 shadow-2xl z-20 transition-all duration-300 ${isLocalTalking ? 'border-brand-cyan shadow-[0_0_30px_rgba(6,182,212,0.4)] scale-105' : 'border-white/20'}`}>
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

                            <div className={`absolute top-2 right-2 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-bold border transition-colors ${isLocalTalking ? 'bg-brand-cyan/80 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'bg-black/40 border-white/10'}`}>
                                {isLocalTalking ? 'TALKING' : 'YOU'}
                            </div>
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
