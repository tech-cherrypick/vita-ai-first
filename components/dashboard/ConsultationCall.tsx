import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../../socket';
import { CallState } from '../../constants';
import WebRTCService from '../../services/WebRTCService';
import TranscriptionService from '../../services/TranscriptionService';

interface ConsultationCallProps {
    onCallEnd: (data?: { transcript: string; summary: string }) => void;
    otherPartyName: string;
    patientId: string;
    role: 'doctor' | 'patient';
}

const ConsultationCall: React.FC<ConsultationCallProps> = ({ onCallEnd, otherPartyName, patientId, role }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const webrtcRef = useRef<WebRTCService | null>(null);
    const transcriptionRef = useRef<TranscriptionService | null>(null);
    const hasEndedRef = useRef(false);
    const socket = getSocket();

    const [callState, setCallState] = useState<CallState>(CallState.INITIALIZING);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isLocalTalking, setIsLocalTalking] = useState(false);
    const [isRemoteMuted, setIsRemoteMuted] = useState(false);
    const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
    const [isRemoteTalking, setIsRemoteTalking] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const handleEndCall = useCallback(async () => {
        if (hasEndedRef.current) return;
        hasEndedRef.current = true;
        setCallState(CallState.ENDED);

        socket.emit('end_call', { patientId, senderRole: role });

        console.log('[ConsultationCall] End call triggered, stopping recorder...');
        const audioBlob = await transcriptionRef.current?.stopAndGetBlob() || null;
        console.log(`[ConsultationCall] Audio blob: ${audioBlob?.size || 0} bytes`);

        console.log('[ConsultationCall] Sending audio to Gemini for transcription...');
        const { summary, formattedTranscript } = await TranscriptionService.generateSummary(audioBlob);
        console.log(`[ConsultationCall] Gemini result - summary length: ${summary.length}, transcript length: ${formattedTranscript.length}`);

        if (role === 'doctor') {
            try {
                console.log('[ConsultationCall] Saving transcript to backend...');
                await TranscriptionService.saveToBackend(patientId, formattedTranscript, summary);
                console.log('[ConsultationCall] Backend save successful');
            } catch (err) {
                console.error('[ConsultationCall] Backend save failed:', err);
            }
        }

        onCallEnd({ transcript: formattedTranscript, summary });
    }, [patientId, role, socket, onCallEnd]);

    useEffect(() => {
        const webrtc = new WebRTCService({
            onRemoteStream: setRemoteStream,
            onIceCandidate: (candidate) => {
                socket.emit('webrtc_signal', { patientId, role, signalData: { candidate } });
            },
            onVoiceActivity: setIsLocalTalking
        });
        webrtcRef.current = webrtc;

        const transcription = new TranscriptionService();
        transcriptionRef.current = transcription;

        const init = async () => {
            try {
                const stream = await webrtc.acquireMedia();
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                if (transcription.start(stream)) setIsTranscribing(true);
            } catch {
                setIsVideoOff(true);
            }

            webrtc.initPeerConnection();
            socket.emit('join_call_room', { patientId, role });
            socket.emit('webrtc_signal', { patientId, role, signalData: { type: 'ping' } });
            setCallState(CallState.WAITING);
        };

        const handleUserJoined = async () => {
            setCallState(CallState.CONNECTED);
            if (role === 'doctor') {
                try {
                    const offer = await webrtc.createOffer();
                    socket.emit('webrtc_signal', { patientId, role, signalData: { offer } });
                } catch { /* offer creation failed */ }
            }
        };

        const handleUserLeft = () => {
            setCallState(CallState.WAITING);
            setRemoteStream(null);
            setIsRemoteMuted(false);
            setIsRemoteVideoOff(false);
            setIsRemoteTalking(false);
        };

        const handleSignal = async (data: any) => {
            if (data.role === role) return;
            const { signalData } = data;
            try {
                if (signalData.offer) {
                    const answer = await webrtc.handleOffer(signalData.offer);
                    socket.emit('webrtc_signal', { patientId, role, signalData: { answer } });
                    setCallState(CallState.CONNECTED);
                } else if (signalData.answer) {
                    await webrtc.handleAnswer(signalData.answer);
                } else if (signalData.candidate) {
                    await webrtc.addIceCandidate(signalData.candidate);
                } else if (signalData.type === 'ping') {
                    setCallState(CallState.CONNECTED);
                    if (role === 'doctor') {
                        const offer = await webrtc.createOffer();
                        socket.emit('webrtc_signal', { patientId, role, signalData: { offer } });
                    }
                }
            } catch { /* signal handling failed */ }
        };

        const handleMediaStatus = (data: any) => {
            if (data.role !== role) {
                setIsRemoteMuted(data.isMuted);
                setIsRemoteVideoOff(data.isVideoOff);
            }
        };

        const handleSpeakingStatus = (data: any) => {
            if (data.role !== role) setIsRemoteTalking(data.isSpeaking);
        };

        socket.on('user_joined_call', handleUserJoined);
        socket.on('user_left_call', handleUserLeft);
        socket.on('webrtc_signal', handleSignal);
        socket.on('media_status_changed', handleMediaStatus);
        socket.on('speaking_status_changed', handleSpeakingStatus);
        socket.on('call_ended', handleEndCall);

        init();

        return () => {
            transcription.stopAndGetBlob();
            webrtc.destroy();
            socket.emit('leave_call_room', { patientId, role });
            socket.off('user_joined_call', handleUserJoined);
            socket.off('user_left_call', handleUserLeft);
            socket.off('webrtc_signal', handleSignal);
            socket.off('media_status_changed', handleMediaStatus);
            socket.off('speaking_status_changed', handleSpeakingStatus);
            socket.off('call_ended', handleEndCall);
        };
    }, [patientId, role, socket, handleEndCall]);

    useEffect(() => {
        socket.emit('media_status_changed', { patientId, role, isMuted, isVideoOff });
    }, [isMuted, isVideoOff, patientId, role, socket]);

    useEffect(() => {
        socket.emit('speaking_status_changed', { patientId, role, isSpeaking: isLocalTalking });
    }, [isLocalTalking, patientId, role, socket]);

    const toggleMic = () => {
        const newMuted = !isMuted;
        webrtcRef.current?.toggleAudio(newMuted);
        setIsMuted(newMuted);
    };

    const toggleVideo = async () => {
        if (!webrtcRef.current) return;
        const stillOff = await webrtcRef.current.toggleVideo(!isVideoOff);
        setIsVideoOff(stillOff);

        if (!stillOff && localVideoRef.current) {
            localVideoRef.current.srcObject = webrtcRef.current.getLocalStream();
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            <div className="flex-1 relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 min-h-[400px]">
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Session</span>
                    </div>
                    {isTranscribing && role === 'doctor' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-purple/40 backdrop-blur-md rounded-full border border-brand-purple/20 animate-fade-in">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-cyan">Transcribing...</span>
                        </div>
                    )}
                </div>
                {/* Main Video (Remote) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {callState !== CallState.CONNECTED ? (
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
                                    className="w-full h-full object-cover transition-opacity duration-500"
                                    ref={(ref) => {
                                        if (ref && remoteStream) {
                                            ref.srcObject = remoteStream;
                                        }
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 transition-opacity duration-500">
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
                                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)]" title="Muted">
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
                <div className={`absolute bottom-6 right-6 w-1/4 max-w-[200px] aspect-[3/4] bg-gray-800 rounded-2xl overflow-hidden border-2 shadow-2xl z-20 transition-all duration-300 ${isLocalTalking ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)] scale-105' : 'border-white/20'}`}>
                    <div className="w-full h-full relative">
                        <video
                            ref={localVideoRef}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0 absolute inset-0' : 'opacity-100'}`}
                            autoPlay
                            playsInline
                            muted
                        />
                        <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-700 transition-opacity duration-300 ${isVideoOff ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-[10px] text-white/60 font-medium font-serif italic">Camera Off</span>
                        </div>
                        <div className={`absolute top-2 right-2 backdrop-blur-sm px-2 py-1 flex items-center gap-1.5 rounded-full text-[10px] text-white font-bold border transition-colors ${isLocalTalking ? 'bg-emerald-500/90 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-black/60 border-white/20'}`}>
                            {isLocalTalking && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                            {isLocalTalking ? 'TALKING' : 'YOU'}
                        </div>
                    </div>
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
