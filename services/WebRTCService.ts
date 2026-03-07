const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
];

const VOICE_THRESHOLD = 15;
const VOICE_CHECK_INTERVAL = 300;
const MAX_VIDEO_BITRATE = 500000;

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    frameRate: { ideal: 24, max: 30 }
};

export interface WebRTCEventHandlers {
    onRemoteStream: (stream: MediaStream) => void;
    onIceCandidate: (candidate: RTCIceCandidate) => void;
    onVoiceActivity: (isTalking: boolean) => void;
}

class WebRTCService {
    private pc: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private voiceCheckTimer: ReturnType<typeof setInterval> | null = null;
    private lastTalkingState = false;
    private handlers: WebRTCEventHandlers;

    constructor(handlers: WebRTCEventHandlers) {
        this.handlers = handlers;
    }

    async acquireMedia(): Promise<MediaStream> {
        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: VIDEO_CONSTRAINTS,
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        this.setupVoiceDetection(this.localStream);
        return this.localStream;
    }

    initPeerConnection(): RTCPeerConnection {
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.pc!.addTrack(track, this.localStream!);
            });
        }

        this.pc.ontrack = (event) => {
            if (event.streams?.[0]) {
                this.handlers.onRemoteStream(event.streams[0]);
            }
        };

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.handlers.onIceCandidate(event.candidate);
            }
        };

        return this.pc;
    }

    async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.pc) throw new Error('PeerConnection not initialized');
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.applyBandwidthLimit();
        return offer;
    }

    async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        if (!this.pc) throw new Error('PeerConnection not initialized');
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }

    async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.pc) throw new Error('PeerConnection not initialized');
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.pc) return;
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }

    toggleAudio(muted: boolean): void {
        this.localStream?.getAudioTracks().forEach(track => {
            track.enabled = !muted;
        });
    }

    async toggleVideo(turnOff: boolean): Promise<boolean> {
        if (!this.localStream || !this.pc) return !turnOff;

        const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');

        if (turnOff) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = false;
                track.stop();
            });
            return true;
        }

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS });
            const newTrack = newStream.getVideoTracks()[0];

            this.localStream.getVideoTracks().forEach(t => this.localStream!.removeTrack(t));
            this.localStream.addTrack(newTrack);

            if (sender) {
                await sender.replaceTrack(newTrack);
            }
            return false;
        } catch {
            return true;
        }
    }

    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    getPeerConnection(): RTCPeerConnection | null {
        return this.pc;
    }

    private applyBandwidthLimit(): void {
        if (!this.pc) return;
        const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
        if (!sender) return;

        try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
                params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = MAX_VIDEO_BITRATE;
            sender.setParameters(params).catch(() => {});
        } catch { /* bandwidth limiting is non-critical */ }
    }

    private setupVoiceDetection(stream: MediaStream): void {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            this.voiceCheckTimer = setInterval(this.checkVoiceLevel, VOICE_CHECK_INTERVAL);
        } catch { /* voice detection is non-critical */ }
    }

    private checkVoiceLevel = (): void => {
        if (!this.analyser) return;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const isTalking = average > VOICE_THRESHOLD;
        if (isTalking !== this.lastTalkingState) {
            this.lastTalkingState = isTalking;
            this.handlers.onVoiceActivity(isTalking);
        }
    };

    destroy(): void {
        if (this.voiceCheckTimer) clearInterval(this.voiceCheckTimer);
        if (this.audioContext) this.audioContext.close().catch(() => {});
        if (this.localStream) this.localStream.getTracks().forEach(t => t.stop());
        if (this.pc) this.pc.close();
        this.pc = null;
        this.localStream = null;
        this.audioContext = null;
        this.analyser = null;
    }
}

export default WebRTCService;

