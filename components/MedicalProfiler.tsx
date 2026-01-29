
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Patient } from '../constants';

const AGENT_AVATAR = "https://cdn.pixabay.com/photo/2024/02/20/11/03/ai-generated-8585220_1280.png";

const STAGES = [
    {
        id: 'disease',
        label: 'Health History',
        icon: '🏥',
        overview: "We're mapping your 'Metabolic Baseline'. Specific conditions help us understand your insulin sensitivity and safety profile.",
        fields: [
            { label: 'Type 2 Diabetes / Pre-diabetes', key: 't2d' },
            { label: 'High Blood Pressure (Medicated)', key: 'hypertension' },
            { label: 'PCOS / Irregular Cycles', key: 'pcos' },
            { label: 'Sleep Apnea / CPAP Use', key: 'sleep_apnea' }
        ],
        hasFreeText: true,
        freeTextLabel: "Other Chronic Conditions (e.g. Thyroid, Kidney, Autoimmune)",
        freeTextKey: "other_conditions"
    },
    {
        id: 'history',
        label: 'Daily Support',
        icon: '💊',
        overview: "Understanding your current 'Daily Support' system allows us to ensure no drug-drug interactions and to see what metabolic scaffolding you already have in place.",
        isMedications: true
    },
    {
        id: 'family',
        label: 'Family Legacy',
        icon: '🧬',
        overview: "Your 'Family Legacy' provides genetic context. While genes aren't destiny, they help us predict your unique response to GLP-1 titration protocols.",
        fields: [
            { label: 'Parent/Sibling with T2 Diabetes', key: 'family_diabetes' },
            { label: 'Family History of Severe Obesity', key: 'family_obesity' },
            { label: 'Heart Attack/Stroke before age 50', key: 'family_cardio' }
        ]
    },
    {
        id: 'thyroid',
        label: 'Safe Guard',
        icon: '🛡️',
        overview: "The 'Safe Guard' check is our primary security protocol. We verify specific markers to ensure your physiology is perfectly suited for GLP-1 therapy.",
        fields: [
            { label: 'Personal/Family History of MTC or MEN 2', key: 'contra_mtc' },
            { label: 'Hospitalization for Pancreatitis', key: 'contra_pancreatitis' },
            { label: 'Pregnant / Breastfeeding / Trying', key: 'contra_pregnancy' }
        ]
    }
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

const updateProfileTool: FunctionDeclaration = {
    name: 'updateProfile',
    parameters: {
        type: Type.OBJECT,
        properties: {
            t2d: { type: Type.BOOLEAN },
            hypertension: { type: Type.BOOLEAN },
            pcos: { type: Type.BOOLEAN },
            sleep_apnea: { type: Type.BOOLEAN },
            other_conditions: { type: Type.STRING },
            medications: { type: Type.STRING },
            family_diabetes: { type: Type.BOOLEAN },
            family_obesity: { type: Type.BOOLEAN },
            family_cardio: { type: Type.BOOLEAN },
            contra_mtc: { type: Type.BOOLEAN },
            contra_men2: { type: Type.BOOLEAN },
            contra_pancreatitis: { type: Type.BOOLEAN },
            contra_pregnancy: { type: Type.BOOLEAN },
        },
    },
};

const showVisualTool: FunctionDeclaration = {
    name: 'showVisual',
    parameters: {
        type: Type.OBJECT,
        properties: {
            mode: { type: Type.STRING, enum: ['summary', 'interview'] }
        },
        required: ['mode']
    }
};

const setPhaseTool: FunctionDeclaration = {
    name: 'setPhase',
    parameters: {
        type: Type.OBJECT,
        properties: {
            phaseId: { type: Type.STRING, enum: ['disease', 'history', 'family', 'thyroid'] }
        },
        required: ['phaseId']
    }
};

interface RowProps {
    label: string;
    value: any;
    field: string;
    onAnswer: (key: string, val: any) => void;
}

const Row: React.FC<RowProps> = ({ label, value, field, onAnswer }) => (
    <div className={`flex justify-between items-center py-5 border-b border-white/5 last:border-0`}>
        <span className="text-sm text-gray-300 font-bold tracking-tight max-w-[60%]">{label}</span>
        <div className="flex gap-3">
            <button onClick={() => onAnswer(field, true)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${value === true ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/5 text-gray-500 opacity-40 hover:opacity-100'}`}>Yes</button>
            <button onClick={() => onAnswer(field, false)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${value === false ? 'bg-brand-purple text-white shadow-[0_0_15px_rgba(192,132,252,0.4)]' : 'bg-white/5 text-gray-500 opacity-40 hover:opacity-100'}`}>No</button>
        </div>
    </div>
);

const MedicalProfiler: React.FC<{ patient: Patient; onClose: () => void; onComplete: (data: any) => void }> = ({ patient, onClose, onComplete }) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const [agentVolume, setAgentVolume] = useState(0);
    const [chartData, setChartData] = useState<any>({});
    const [visualMode, setVisualMode] = useState<string>('intro');
    const [activeStageIndex, setActiveStageIndex] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sessionRef = useRef<any | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
    const nextStartTimeRef = useRef<number>(0);
    const cardScrollRef = useRef<HTMLDivElement>(null);

    const activeStage = STAGES[activeStageIndex];

    const handleManualAnswer = (key: string, value: any) => {
        setChartData((prev: any) => ({ ...prev, [key]: value }));
        sessionRef.current?.sendRealtimeInput({ text: `User manually confirmed ${value} for ${key}.` });
    };

    const handleNextPhase = () => {
        if (activeStageIndex < STAGES.length - 1) {
            const nextIdx = activeStageIndex + 1;
            setActiveStageIndex(nextIdx);
            if (cardScrollRef.current) cardScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            sessionRef.current?.sendRealtimeInput({ text: `User clicked NEXT button. I am now showing the ${STAGES[nextIdx].label} card. Please give a brief clinical overview of this area.` });
        } else {
            setVisualMode('summary');
            if (cardScrollRef.current) cardScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            sessionRef.current?.sendRealtimeInput({ text: `User clicked NEXT on the final section. Please wrap up the session and confirm the blueprint is complete.` });
        }
    };

    useEffect(() => {
        if (!hasStarted) return;
        const init = async () => {
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
                const analyser = audioContextRef.current.createAnalyser();
                analyser.fftSize = 64; analyser.connect(audioContextRef.current.destination); analyserRef.current = analyser;
                await audioContextRef.current.audioWorklet.addModule(URL.createObjectURL(new Blob([workletCode], { type: "application/javascript" })));
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        tools: [{ functionDeclarations: [updateProfileTool, showVisualTool, setPhaseTool] }],
                        systemInstruction: {
                            parts: [{
                                text: `You are the Vita Senior Clinical Registrar. Your job is to guide the patient through their health history.
                        
                        LANGUAGE: Indian Professional English.
                        TONE: Professional, methodical, and respectful. Always address as Sir/Ma'am.

                        WORKFLOW:
                        Sequential Review of 4 Clinical Cards:
                        1. Health History (disease)
                        2. Daily Support (history)
                        3. Family Legacy (family)
                        4. Safe Guard Check (thyroid)

                        AGENT PROTOCOL:
                        - When a new card is shown, provide a 2-3 sentence overview of why this area is relevant to metabolic profiling.
                        - DO NOT go through each question one-by-one. Sir/Ma'am will fill them manually on the screen.
                        - When they click 'Next', acknowledge the transition and provide the overview for the next section.
                        
                        Call showVisual('interview') and setPhase('disease') to start.` }]
                        }
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
                            }
                            const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (data && audioContextRef.current) {
                                const bytes = decode(data);
                                const f32 = new Float32Array(bytes.length / 2);
                                const view = new DataView(bytes.buffer);
                                for (let i = 0; i < bytes.length / 2; i++) f32[i] = view.getInt16(i * 2, true) / 32768.0;
                                const buf = audioContextRef.current.createBuffer(1, f32.length, 24000);
                                buf.getChannelData(0).set(f32);
                                const src = audioContextRef.current.createBufferSource();
                                src.buffer = buf; src.connect(analyserRef.current!);
                                const start = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                                src.start(start); nextStartTimeRef.current = start + buf.duration;
                                setIsAgentSpeaking(true); sourceNodesRef.current.push(src);
                                src.onended = () => {
                                    sourceNodesRef.current = sourceNodesRef.current.filter(s => s !== src);
                                    if (sourceNodesRef.current.length === 0) setIsAgentSpeaking(false);
                                };
                            }
                            if (msg.toolCall) {
                                msg.toolCall.functionCalls.forEach(call => {
                                    if (call.name === 'updateProfile') setChartData(prev => ({ ...prev, ...call.args }));
                                    else if (call.name === 'showVisual') setVisualMode(call.args.mode as string);
                                    else if (call.name === 'setPhase') {
                                        const idx = STAGES.findIndex(s => s.id === call.args.phaseId);
                                        if (idx !== -1) setActiveStageIndex(idx);
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
            } catch (err) { }
        };
        init();
        return () => { if (sessionRef.current) sessionRef.current.close(); };
    }, [hasStarted]);

    useEffect(() => {
        const draw = () => {
            if (analyserRef.current) {
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                const vol = data.reduce((a, b) => a + b) / data.length;
                setAgentVolume(vol / 128);
            }
            requestAnimationFrame(draw);
        };
        draw();
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col font-sans overflow-hidden">
            {!hasStarted && (
                <div className="absolute inset-0 z-[60] bg-black/95 flex items-center justify-center p-8 animate-fade-in backdrop-blur-3xl">
                    <div className="bg-gray-900 p-14 rounded-[60px] border border-white/10 max-w-sm shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-cyan to-brand-purple"></div>
                        <h2 className="text-4xl font-black mb-8 text-white tracking-tighter uppercase leading-none">Your <br /> Health Blueprint</h2>
                        <button onClick={() => setHasStarted(true)} className="w-full py-7 bg-brand-cyan text-black font-black rounded-3xl uppercase tracking-[0.3em] text-[10px] shadow-[0_0_25px_rgba(192,132,252,0.3)]">Authorize Link</button>
                        <button onClick={onClose} className="mt-10 text-[9px] font-black uppercase text-gray-600 tracking-[0.4em] hover:text-white transition-colors">Abort</button>
                    </div>
                </div>
            )}

            {/* Vertical Progress Rail */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-[55] flex flex-col items-center gap-6 py-10">
                <div className="text-[8px] font-black uppercase tracking-[0.6em] text-brand-purple/40 rotate-180 [writing-mode:vertical-lr] mb-4">Your Blueprint</div>
                <div className="w-[1.5px] h-64 bg-white/5 relative rounded-full">
                    <div
                        className="absolute top-0 w-full bg-brand-purple shadow-[0_0_15px_#C084FC] transition-all duration-1000 ease-in-out"
                        style={{ height: `${((activeStageIndex + 1) / STAGES.length) * 100}%` }}
                    />
                </div>
                <div className="flex flex-col gap-4 mt-2">
                    {STAGES.map((s, i) => (
                        <div key={s.id} className={`w-2 h-2 rounded-full transition-all duration-700 ${i <= activeStageIndex ? 'bg-brand-purple scale-110 shadow-[0_0_10px_#C084FC]' : 'bg-white/5'}`} title={s.label}></div>
                    ))}
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-center p-10 border-b border-white/5 ml-16">
                <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_15px_#4ade80]' : 'bg-yellow-400 animate-pulse'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">Secure Clinical Link</span>
                </div>
                <button onClick={onClose} className="px-6 py-2.5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Close</button>
            </div>

            <div className="flex-1 flex items-center justify-center p-10 ml-16">
                <div className="w-full max-w-md h-[680px] bg-white/[0.02] border border-white/10 rounded-[60px] backdrop-blur-3xl overflow-hidden relative shadow-2xl flex flex-col transition-all duration-500 transform translate-y-[-2%]">
                    <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">{activeStage.label} Assessment</h3>
                        <span className="text-sm">{activeStage.icon}</span>
                    </div>

                    <div ref={cardScrollRef} className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
                        {visualMode === 'intro' && (
                            <div className="p-12 text-center flex flex-col items-center justify-center h-full animate-fade-in">
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">Mapping Your <br />Metabolic <br /> Profile</h3>
                                <p className="text-sm text-gray-500 mt-6 leading-relaxed">The registrar will provide an overview of each clinical section. Please complete the assessment cards below.</p>
                            </div>
                        )}

                        {visualMode === 'interview' && (
                            <div className="animate-fade-in flex flex-col min-h-full">
                                <div className="mb-10">
                                    <h4 className="text-lg font-black text-white mb-3 flex items-center gap-3">
                                        <span className="text-brand-purple">{activeStage.icon}</span> {activeStage.label}
                                    </h4>
                                    <p className="text-xs text-brand-purple/80 leading-relaxed font-medium bg-brand-purple/5 border-l-2 border-brand-purple/40 pl-5 py-3 rounded-r-xl">
                                        {activeStage.overview}
                                    </p>
                                </div>

                                <div className="space-y-4 flex-1">
                                    {activeStage.isMedications ? (
                                        <div className="bg-white/[0.03] p-6 rounded-[32px] border border-white/10 min-h-[200px] flex flex-col">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Current Medications</label>
                                            <textarea
                                                value={chartData.medications || ''}
                                                onChange={e => setChartData({ ...chartData, medications: e.target.value })}
                                                placeholder="List all prescription medications, vitamins, and supplements..."
                                                className="flex-1 bg-black/20 rounded-2xl p-4 text-sm text-gray-300 outline-none focus:ring-1 focus:ring-brand-purple/40 resize-none"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-white/[0.03] p-6 rounded-[32px] border border-white/10 space-y-2">
                                            {activeStage.fields?.map(field => (
                                                <Row
                                                    key={field.key}
                                                    label={field.label}
                                                    field={field.key}
                                                    value={chartData[field.key]}
                                                    onAnswer={handleManualAnswer}
                                                />
                                            ))}
                                            {activeStage.hasFreeText && (
                                                <div className="pt-4 border-t border-white/5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3 block">{activeStage.freeTextLabel}</label>
                                                    <textarea
                                                        value={chartData[activeStage.freeTextKey] || ''}
                                                        onChange={e => setChartData({ ...chartData, [activeStage.freeTextKey]: e.target.value })}
                                                        placeholder="Please describe..."
                                                        className="w-full bg-black/20 rounded-2xl p-4 text-sm text-gray-300 outline-none focus:ring-1 focus:ring-brand-purple/40 resize-none h-24"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-8 border-t border-white/5 shrink-0 bg-gradient-to-t from-gray-900 to-transparent sticky bottom-0">
                                    <button
                                        onClick={handleNextPhase}
                                        className="w-full py-5 bg-white text-black font-black rounded-3xl uppercase tracking-[0.3em] text-[10px] hover:bg-brand-purple hover:text-white transition-all shadow-xl flex items-center justify-center gap-2 group"
                                    >
                                        {activeStageIndex < STAGES.length - 1 ? 'Next Section' : 'Generate Blueprint'} <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {visualMode === 'summary' && (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10 animate-fade-in">
                                <div className="w-24 h-24 bg-brand-purple/20 rounded-full flex items-center justify-center mb-8 border border-brand-purple/30 shadow-[0_0_30px_rgba(192,132,252,0.2)]">
                                    <svg className="w-12 h-12 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Blueprint <br />Complete</h4>
                                <p className="text-sm text-gray-500 mb-10 max-w-xs mx-auto">Your metabolic history has been successfully synchronized and secured.</p>
                                <button onClick={() => onComplete(chartData)} className="w-full py-6 bg-brand-purple text-white font-black rounded-[32px] uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all">Submit Profiles</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Assistant Floating Bubble Style */}
            <div className="fixed bottom-10 right-10 z-[60] flex flex-col items-center gap-4 group">
                <div className="flex gap-1.5 h-8 items-center mb-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1 bg-brand-purple rounded-full transition-all duration-100"
                            style={{
                                height: `${Math.max(4, agentVolume * 80 * (Math.random() + 0.3))}px`,
                                opacity: isAgentSpeaking ? 1 : 0.1
                            }}
                        ></div>
                    ))}
                </div>
                <div className="relative">
                    <div className={`w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-brand-purple to-brand-cyan shadow-2xl transition-all duration-700 ${isAgentSpeaking ? 'scale-110 shadow-[0_0_30px_rgba(192,132,252,0.5)]' : 'scale-100 opacity-80'}`}>
                        <img src={AGENT_AVATAR} className="w-full h-full rounded-full object-cover grayscale-[10%]" alt="Vita" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-purple rounded-full border-2 border-black flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-ping"></div>
                    </div>
                </div>
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Clinical Registrar</p>
            </div>
        </div>
    );
};

export default MedicalProfiler;
