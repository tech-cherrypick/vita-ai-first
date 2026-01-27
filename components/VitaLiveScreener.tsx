
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import WeightLossGraph from './WeightLossGraph';

// --- Assets ---
const NURSE_AVATAR_URL = "https://cdn.pixabay.com/photo/2024/02/20/11/03/ai-generated-8585220_1280.png"; 

const STAGES = [
    { id: 'intro', label: 'Welcome' },
    { id: 'vitals', label: 'The Baseline' },
    { id: 'medical', label: 'Metabolic DNA' },
    { id: 'assessment', label: 'The Outcome' },
    { id: 'scheduling', label: 'Starting Line' }
];

const workletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const float32Data = input[0];
      this.port.postMessage(float32Data);
    }
    return true;
  }
}
registerProcessor("recorder-worklet", RecorderProcessor);
`;

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function floatTo16BitPCM(float32Array: Float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

// --- Tools ---
const setStageTool: FunctionDeclaration = {
    name: 'setStage',
    parameters: {
        type: Type.OBJECT,
        properties: {
            stage: { type: Type.STRING, enum: ['intro', 'vitals', 'medical', 'assessment', 'scheduling'] }
        },
        required: ['stage']
    }
};

const showVisualTool: FunctionDeclaration = {
    name: 'showVisual',
    parameters: {
        type: Type.OBJECT,
        properties: {
            mode: { type: Type.STRING, enum: ['welcome', 'vitals_card', 'phenotype', 'breakthrough', 'weight_loss', 'booking'] }
        },
        required: ['mode']
    }
};

const highlightFieldTool: FunctionDeclaration = {
    name: 'highlightField',
    parameters: {
        type: Type.OBJECT,
        properties: {
            field: { type: Type.STRING, enum: ['height', 'weight', 'name', 'email', 'phone', 'date', 'time', 'none'] }
        },
        required: ['field']
    }
};

const updateIntakeTool: FunctionDeclaration = {
    name: 'updateIntake',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            weight: { type: Type.NUMBER },
            heightFt: { type: Type.NUMBER },
            heightIn: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING }
        },
    },
};

// --- Sub-components for coordination ---
const CardWrapper: React.FC<{ isSpeaking: boolean; children: React.ReactNode }> = ({ isSpeaking, children }) => (
    <div className={`transition-all duration-500 rounded-[40px] ${isSpeaking ? 'scale-[1.02] shadow-[0_0_50px_rgba(94,234,212,0.3)] ring-2 ring-brand-cyan/20' : 'scale-100 shadow-2xl'}`}>
        {children}
    </div>
);

const VitaLiveScreener: React.FC<{ onClose: () => void; onComplete: (details: any) => void }> = ({ onClose, onComplete }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentStage, setCurrentStage] = useState(0);
    const [agentVolume, setAgentVolume] = useState(0);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const [activeVisual, setActiveVisual] = useState<string>('welcome');
    const [highlightedField, setHighlightedField] = useState<string | null>(null);
    const [intakeData, setIntakeData] = useState<any>({ name: '', email: '', phone: '', weight: 0, heightFt: 0, heightIn: 0, riskLevel: 'Normal' });
    const [selectedDateTime, setSelectedDateTime] = useState<{date: string, time: string}>({ date: '', time: '' });

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sessionRef = useRef<any | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
    const intakeRef = useRef<any>({ name: '', email: '', phone: '', weight: 0, heightFt: 0, heightIn: 0, riskLevel: 'Normal' });

    const cleanupMedia = () => {
        sourceNodesRef.current.forEach(n => { try { n.stop(); } catch(e) {} });
        if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
        if (sessionRef.current) sessionRef.current.close();
    };

    const startSession = async () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 64; 
            analyser.connect(audioContextRef.current.destination);
            analyserRef.current = analyser;
            await audioContextRef.current.audioWorklet.addModule(URL.createObjectURL(new Blob([workletCode], { type: "application/javascript" })));
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    tools: [{ functionDeclarations: [setStageTool, updateIntakeTool, showVisualTool, highlightFieldTool] }],
                    systemInstruction: `You are Vita, a specialist at Vita Health. 
                    
                    LANGUAGE: Indian Professional English.
                    TONE: Serious, thorough, lifestyle-oriented, professional, and warm. Always address the user as Sir/Ma'am.
                    
                    MANDATORY SYNC PROTOCOL:
                    1. Before moving to a new visual card, you MUST call 'showVisual' and 'setStage'.
                    2. To focus the patient on specific information or input fields as you speak about them, call 'highlightField'.
                    
                    UNIFIED BOOKING PROTOCOL (CRITICAL):
                    When you reach the final step ('scheduling' stage / 'booking' visual):
                    - DO NOT suggest specific time slots yourself. 
                    - Instead, call showVisual('booking') and setStage('scheduling').
                    - Guide the user to update the unified booking form on the card.
                    - Walk them through: entering their Name (highlightField: 'name'), Email ('email'), Phone ('phone'), and then selecting a date ('date') and time ('time') from the interactive calendar.
                    
                    PROTOCOL STEPS:
                    1. Welcome: Introduce yourself. (showVisual: 'welcome')
                    2. The Baseline: Ask for height and weight. (showVisual: 'vitals_card')
                    3. Metabolic DNA: Discuss ethnic risk factors for South Asians. (showVisual: 'phenotype')
                    4. breakthrough: Confirm eligibility. (showVisual: 'breakthrough')
                    5. weight_loss: Show potential outcome. (showVisual: 'weight_loss')
                    6. booking: Instruct the user to complete the unified form (Name, Email, Phone, and Calendar) displayed on the card to finish onboarding. (showVisual: 'booking')
                    `
                },
                callbacks: {
                    onopen: () => {
                        setIsConnected(true);
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        const processor = new AudioWorkletNode(audioContextRef.current!, "recorder-worklet");
                        processor.port.onmessage = (ev) => {
                            const base64 = encode(new Uint8Array(floatTo16BitPCM(ev.data)));
                            sessionPromise.then(s => s.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: base64 } }));
                        };
                        source.connect(processor);
                        processor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (msg.serverContent?.interrupted) {
                            sourceNodesRef.current.forEach(node => node.stop());
                            sourceNodesRef.current = [];
                            nextStartTimeRef.current = 0;
                            setIsAgentSpeaking(false);
                            setHighlightedField(null);
                        }
                        const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audio && audioContextRef.current) {
                            const bytes = decode(audio);
                            const f32 = new Float32Array(bytes.length / 2);
                            const view = new DataView(bytes.buffer);
                            for (let i = 0; i < bytes.length / 2; i++) f32[i] = view.getInt16(i * 2, true) / 32768.0;
                            const buf = audioContextRef.current.createBuffer(1, f32.length, 24000);
                            buf.getChannelData(0).set(f32);
                            const src = audioContextRef.current.createBufferSource();
                            src.buffer = buf; src.connect(analyserRef.current!);
                            const start = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                            src.start(start);
                            nextStartTimeRef.current = start + buf.duration;
                            setIsAgentSpeaking(true);
                            sourceNodesRef.current.push(src);
                            src.onended = () => {
                                sourceNodesRef.current = sourceNodesRef.current.filter(s => s !== src);
                                if (sourceNodesRef.current.length === 0) {
                                    setIsAgentSpeaking(false);
                                    setHighlightedField(null);
                                }
                            };
                        }
                        if (msg.toolCall) {
                            msg.toolCall.functionCalls.forEach(call => {
                                if (call.name === 'setStage') { 
                                    const idx = STAGES.findIndex(s => s.id === call.args.stage);
                                    if (idx !== -1) setCurrentStage(idx);
                                }
                                else if (call.name === 'showVisual') {
                                    setActiveVisual(call.args.mode as string);
                                }
                                else if (call.name === 'highlightField') {
                                    setHighlightedField(call.args.field === 'none' ? null : (call.args.field as string));
                                }
                                else if (call.name === 'updateIntake') {
                                    const updated = { ...intakeRef.current, ...call.args };
                                    intakeRef.current = updated; setIntakeData(updated);
                                }
                                sessionPromise.then(s => s.sendToolResponse({ functionResponses: { name: call.name, id: call.id, response: { status: 'ok' } } }));
                            });
                        }
                    },
                    onclose: () => setIsConnected(false),
                    onerror: () => setIsConnected(false)
                }
            });
            sessionRef.current = await sessionPromise;
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const update = () => {
            if (analyserRef.current) {
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b) / data.length;
                setAgentVolume(avg / 255);
            }
            requestAnimationFrame(update);
        };
        update();
    }, []);

    const timeSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "03:30 PM", "05:00 PM"];
    const dates = useMemo(() => {
        const d = [];
        for(let i=1; i<=5; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            d.push({
                full: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                short: date.getDate()
            });
        }
        return d;
    }, []);

    const renderContent = () => {
        const speaking = isAgentSpeaking;
        switch (activeVisual) {
            case 'welcome': return (
                <div className="text-center animate-fade-in p-10">
                    <div className="w-20 h-20 bg-brand-cyan/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-cyan/30">
                        <div className="w-3 h-3 bg-brand-cyan rounded-full animate-ping"></div>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-4 leading-none">Starting Your <br/>Journey</h2>
                    <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Clinical Onboarding</p>
                </div>
            );
            case 'vitals_card': return (
                <CardWrapper isSpeaking={speaking}>
                    <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10">
                        <h3 className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.4em] mb-10">The Baseline</h3>
                        <div className="space-y-6">
                            <div className={`flex justify-between items-center bg-white/[0.03] p-6 rounded-3xl border transition-all duration-500 ${highlightedField === 'weight' ? 'border-brand-cyan bg-brand-cyan/10 scale-[1.03] ring-1 ring-brand-cyan' : 'border-white/5'}`}>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Weight</span>
                                <span className="text-3xl font-black text-white">{intakeData.weight || '--'} <span className="text-sm font-medium text-gray-500">kg</span></span>
                            </div>
                            <div className={`flex justify-between items-center bg-white/[0.03] p-6 rounded-3xl border transition-all duration-500 ${highlightedField === 'height' ? 'border-brand-cyan bg-brand-cyan/10 scale-[1.03] ring-1 ring-brand-cyan' : 'border-white/5'}`}>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Height</span>
                                <span className="text-3xl font-black text-white">{intakeData.heightFt || '--'}'{intakeData.heightIn || '0'}"</span>
                            </div>
                        </div>
                    </div>
                </CardWrapper>
            );
            case 'phenotype': return (
                <CardWrapper isSpeaking={speaking}>
                    <div className="w-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 animate-slide-in-right">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-8 text-center">Metabolic DNA</h3>
                        <div className="relative flex justify-center py-10 bg-white/[0.02] rounded-[32px] border border-white/5 mb-6 overflow-hidden">
                            <svg viewBox="0 0 100 120" className="h-64 opacity-80">
                                <path d="M50 10 C42 10 38 18 38 25 C38 32 42 35 45 40 C35 45 28 55 28 75 C28 100 35 110 35 115 L45 120 L55 120 L65 115 C65 110 72 100 72 75 C72 55 65 45 55 40 C58 35 62 32 62 25 C62 18 58 10 50 10 Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                                <circle cx="50" cy="75" r="14" fill="rgba(239, 68, 68, 0.4)" className="animate-pulse" />
                            </svg>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-[9px] font-black uppercase text-red-400 tracking-widest">Internal Risk</p>
                                <p className="text-2xl font-black text-white">Detected</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center leading-relaxed">We're checking for silent metabolic markers <br/>unique to your heritage.</p>
                    </div>
                </CardWrapper>
            );
            case 'breakthrough': return (
                <CardWrapper isSpeaking={speaking}>
                    <div className="w-full bg-brand-cyan/10 backdrop-blur-3xl border border-brand-cyan/30 rounded-[40px] p-10 animate-slide-in-up text-center">
                        <div className="w-20 h-20 bg-brand-cyan rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_20px_#5EEAD4]">
                            <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">Confirmed <br/>Success Path</h3>
                        <p className="text-brand-cyan text-xs font-bold uppercase tracking-[0.2em]">Your profile matches our program</p>
                    </div>
                </CardWrapper>
            );
            case 'weight_loss': return (
                <CardWrapper isSpeaking={speaking}>
                    <div className="w-full bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 animate-slide-in-right">
                        <h3 className="text-[10px] font-black text-brand-purple uppercase tracking-[0.4em] mb-10 text-center">Your Potential Outcome</h3>
                        <WeightLossGraph startWeight={intakeData.weight || 85} endWeight={(intakeData.weight || 85) * 0.82} unit="kg" />
                    </div>
                </CardWrapper>
            );
            case 'booking': return (
                <CardWrapper isSpeaking={speaking}>
                    <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 animate-slide-in-right overflow-y-auto max-h-[65vh] no-scrollbar">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 leading-tight text-center">Secure Your <br/>Starting Line</h3>
                        
                        <div className="space-y-4 mb-10">
                            <div className="space-y-1">
                                <label className={`text-[9px] font-black uppercase tracking-widest ml-4 transition-colors ${highlightedField === 'name' ? 'text-brand-cyan' : 'text-white/40'}`}>Full Name</label>
                                <input 
                                    value={intakeData.name} 
                                    onChange={e => setIntakeData({...intakeData, name: e.target.value})}
                                    placeholder="Patient Name" 
                                    className={`w-full bg-black/30 border rounded-2xl p-4 text-white text-sm outline-none transition-all ${highlightedField === 'name' ? 'border-brand-cyan ring-1 ring-brand-cyan/40 bg-brand-cyan/5' : 'border-white/10'}`} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={`text-[9px] font-black uppercase tracking-widest ml-4 transition-colors ${highlightedField === 'email' ? 'text-brand-cyan' : 'text-white/40'}`}>Contact Link</label>
                                <input 
                                    value={intakeData.email} 
                                    onChange={e => setIntakeData({...intakeData, email: e.target.value})}
                                    placeholder="Email Address" 
                                    className={`w-full bg-black/30 border rounded-2xl p-4 text-white text-sm outline-none transition-all ${highlightedField === 'email' ? 'border-brand-cyan ring-1 ring-brand-cyan/40 bg-brand-cyan/5' : 'border-white/10'}`} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={`text-[9px] font-black uppercase tracking-widest ml-4 transition-colors ${highlightedField === 'phone' ? 'text-brand-cyan' : 'text-white/40'}`}>Phone Number</label>
                                <input 
                                    value={intakeData.phone} 
                                    onChange={e => setIntakeData({...intakeData, phone: e.target.value})}
                                    placeholder="+91 00000 00000" 
                                    className={`w-full bg-black/30 border rounded-2xl p-4 text-white text-sm outline-none transition-all ${highlightedField === 'phone' ? 'border-brand-cyan ring-1 ring-brand-cyan/40 bg-brand-cyan/5' : 'border-white/10'}`} 
                                />
                            </div>
                        </div>

                        <div className="mb-10">
                            <label className={`text-[9px] font-black uppercase tracking-widest ml-4 mb-3 block transition-colors ${highlightedField === 'date' ? 'text-brand-cyan' : 'text-white/40'}`}>Choose a Date</label>
                            <div className={`flex gap-2 overflow-x-auto no-scrollbar pb-2 rounded-xl transition-all ${highlightedField === 'date' ? 'ring-1 ring-brand-cyan/50 p-2 bg-brand-cyan/5' : ''}`}>
                                {dates.map((d, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedDateTime({...selectedDateTime, date: d.full})}
                                        className={`flex-shrink-0 w-12 h-14 rounded-xl flex flex-col items-center justify-center border transition-all ${selectedDateTime.date === d.full ? 'bg-brand-cyan border-brand-cyan text-black font-black scale-105 shadow-lg' : 'bg-black/20 border-white/10 text-white/60 hover:border-white/30'}`}
                                    >
                                        <span className="text-[7px] uppercase font-bold">{d.full.split(' ')[0]}</span>
                                        <span className="text-sm font-black">{d.short}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-12">
                            <label className={`text-[9px] font-black uppercase tracking-widest ml-4 mb-3 block transition-colors ${highlightedField === 'time' ? 'text-brand-cyan' : 'text-white/40'}`}>Choose a Time</label>
                            <div className={`grid grid-cols-2 gap-2 rounded-xl transition-all ${highlightedField === 'time' ? 'ring-1 ring-brand-cyan/50 p-2 bg-brand-cyan/5' : ''}`}>
                                {timeSlots.map((t, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedDateTime({...selectedDateTime, time: t})}
                                        className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedDateTime.time === t ? 'bg-white text-black border-white shadow-lg' : 'bg-black/20 border-white/10 text-white/40 hover:border-white/30'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => onComplete({ date: selectedDateTime.date, time: selectedDateTime.time, vitals: intakeData })} 
                            disabled={!selectedDateTime.date || !selectedDateTime.time || !intakeData.phone}
                            className="w-full py-5 bg-brand-cyan text-black font-black rounded-3xl uppercase tracking-[0.3em] text-[10px] shadow-[0_0_30px_rgba(94,234,212,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                        >
                            Confirm & Start Journey
                        </button>
                    </div>
                </CardWrapper>
            );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col font-sans overflow-hidden">
            {!isSessionActive && (
                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl p-10 animate-fade-in">
                     <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-brand-cyan to-brand-purple mb-12 shadow-[0_0_40px_rgba(94,234,212,0.2)]">
                        <img src={NURSE_AVATAR_URL} className="w-full h-full rounded-full object-cover grayscale-[20%]" alt="Vita" />
                     </div>
                     <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-6 text-center">Your <br/>Health Path</h2>
                     <button onClick={() => { setIsSessionActive(true); startSession(); }} className="w-full max-w-xs py-7 bg-brand-cyan text-black font-black rounded-[40px] text-[10px] uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(94,234,212,0.4)]">Begin Chat</button>
                     <button onClick={onClose} className="mt-12 text-[9px] font-black uppercase text-gray-600 tracking-[0.5em] hover:text-white transition-colors">Abort</button>
                </div>
            )}
            
            {/* Named Vertical Progress Rail */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-[55] flex flex-col items-center gap-6 py-8">
                <div className="text-[7px] font-black uppercase tracking-[0.5em] text-brand-cyan/40 rotate-180 [writing-mode:vertical-lr] mb-4">Your Path</div>
                <div className="w-[1px] h-64 bg-white/10 relative rounded-full">
                    <div 
                        className="absolute top-0 w-full bg-brand-cyan shadow-[0_0_15px_#5EEAD4] transition-all duration-1000 ease-out" 
                        style={{ height: `${((currentStage + 1) / STAGES.length) * 100}%` }}
                    />
                </div>
                <div className="flex flex-col gap-4 mt-2">
                    {STAGES.map((s, i) => (
                        <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${i <= currentStage ? 'bg-brand-cyan scale-125 shadow-[0_0_8px_#5EEAD4]' : 'bg-white/10'}`} title={s.label}></div>
                    ))}
                </div>
            </div>

            <div className="relative z-50 p-10 flex justify-between items-center ml-16">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Link Established</span>
                </div>
                <button onClick={() => { cleanupMedia(); onClose(); }} className="px-6 py-2.5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Close</button>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center px-8 ml-16">
                <div className="w-full max-w-md transform translate-y-[-5%]">
                    {renderContent()}
                </div>
            </div>

            {/* Assistant Floating Bubble Style */}
            <div className="fixed bottom-10 right-10 z-[60] flex flex-col items-center gap-4 group">
                <div className="flex gap-1.5 h-8 items-center mb-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1 bg-brand-cyan rounded-full transition-all duration-100" 
                             style={{ 
                                height: `${Math.max(4, agentVolume * 80 * (Math.random() + 0.3))}px`,
                                opacity: isAgentSpeaking ? 1 : 0.1
                             }}
                        ></div>
                    ))}
                </div>
                <div className="relative">
                    <div className={`w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-brand-cyan to-brand-purple shadow-2xl transition-all duration-700 ${isAgentSpeaking ? 'scale-110 shadow-[0_0_30px_rgba(94,234,212,0.5)]' : 'scale-100 opacity-80'}`}>
                        <img src={NURSE_AVATAR_URL} className="w-full h-full rounded-full object-cover grayscale-[10%]" alt="Vita" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-cyan rounded-full border-2 border-black flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-ping"></div>
                    </div>
                </div>
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Vita Live</p>
            </div>
        </div>
    );
};

export default VitaLiveScreener;
