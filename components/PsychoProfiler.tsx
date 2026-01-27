
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Patient } from '../constants';

const AGENT_AVATAR = "https://cdn.pixabay.com/photo/2024/02/20/11/03/ai-generated-8585220_1280.png";

// --- Comprehensive Questionnaire Data ---

const phq9Questions = [
    "Over the last 2 weeks, how often have you found little pleasure or interest in doing things you usually enjoy?",
    "How often have you felt down, depressed, or hopeless about the future?",
    "Have you had trouble falling asleep, staying asleep, or found yourself sleeping too much?",
    "How often have you felt tired or had little energy to get through the day?",
    "Have you experienced a poor appetite or found yourself overeating?",
    "Have you felt bad about yourself — or that you are a failure or have let yourself or your family down?",
    "Have you had trouble concentrating on things, such as reading the newspaper or watching television?",
    "Have you moved or spoken so slowly that other people could have noticed? Or the opposite — being so fidgety or restless?",
    "Have you had thoughts that you would be better off dead or of hurting yourself in some way?"
];

const besQuestions = [
    { 
        id: 1, 
        label: "Appearance Insecurity",
        options: [
            "I don't feel self-conscious about my weight or body size when I'm with others.", 
            "I feel concerned about how I look to others, but it normally doesn't make me feel disappointed with myself.", 
            "I do get self-conscious about my appearance and weight which makes me feel disappointed in myself.", 
            "I feel very self-conscious about my weight and frequently, I feel like I'm just failing at everything."
        ] 
    },
    { 
        id: 2, 
        label: "Eating Speed",
        options: [
            "I don't have any difficulty eating slowly in the proper manner.", 
            "Although I seem to devour foods, I don't end up feeling stuffed because of eating too much.", 
            "At times, I tend to eat quickly and then, I feel uncomfortably full afterwards.", 
            "I have the habit of bolting down my food, without really chewing it. When this happens I usually feel uncomfortably stuffed because I've eaten too much."
        ] 
    },
    { 
        id: 3, 
        label: "Control over Urges",
        options: [
            "I feel capable to control my eating urges when I want to.", 
            "I feel like I have failed to control my eating more than the average person.", 
            "I feel utterly helpless when it comes to controlling my eating urges.", 
            "Because I feel so helpless about controlling my eating I have become very desperate about trying to get in control."
        ] 
    },
    { 
        id: 4, 
        label: "Emotional Eating (Boredom)",
        options: [
            "I don't have the habit of eating when I'm bored.", 
            "I sometimes eat when I'm bored, but often I'm able to get busy and get my mind off food.", 
            "I have a regular habit of eating when I'm bored, but occasionally, I can use some other activity to get my mind off it.", 
            "I have a strong habit of eating when I'm bored. Nothing seems to help me break the habit."
        ] 
    },
    { 
        id: 5, 
        label: "Physical vs Mental Hunger",
        options: [
            "I'm usually physically hungry when I eat something.", 
            "Occasionally, I eat something on impulse even though I'm not really hungry.", 
            "I have the regular habit of eating foods, that I might not really enjoy, to satisfy a hungry feeling even though physically, I don't need the food.", 
            "Even though I'm not physically hungry, I get a hungry feeling in my mouth that only seems to be satisfied when I eat a food."
        ] 
    },
    { 
        id: 6, 
        label: "Post-Eating Guilt",
        options: [
            "I don't feel any guilt or self-hate after I overeat.", 
            "After I overeat, occasionally I feel guilt or self-hate.", 
            "Almost all the time I experience strong guilt or self-hate after I overeat."
        ] 
    },
    { 
        id: 7, 
        label: "Dietary Compliance",
        options: [
            "I don't lose total control of my eating when dieting even after periods when I overeat.", 
            "Sometimes when I eat a \"forbidden food\" on a diet, I feel like I blew it and eat even more.", 
            "Frequently, I have the habit of saying to myself, \"I've blown it now, why not go all the way\" when I overeat on a diet."
        ] 
    },
    { 
        id: 8, 
        label: "Satiety Awareness",
        options: [
            "I rarely eat so much food that I feel uncomfortably stuffed afterwards.", 
            "Usually about once a month, I eat such a quantity of food, I end up feeling very stuffed.", 
            "I have regular periods during the month when I eat large amounts of food, either at mealtime or at snacks.", 
            "I eat so much food that I regularly feel quite uncomfortable after eating."
        ] 
    }
];

const eat26Questions = [
    "I feel an intense, overwhelming fear about the idea of being overweight.",
    "I actively ignore hunger signals and avoid eating even when my body physically needs food.",
    "I find myself constantly preoccupied with thoughts about food.",
    "I have gone on eating binges where I feel that I may not be able to stop.",
    "I cut my food into small pieces to make it last longer or seem like more.",
    "I am acutely aware of the calorie content of every food that I eat.",
    "I particularly avoid foods with a high carbohydrate content (e.g., bread, rice, potatoes).",
    "I feel that others would prefer if I ate more than I do.",
    "I vomit after I have eaten to control my weight.",
    "I feel extremely guilty after eating.",
    "I am preoccupied with a desire to be thinner.",
    "I think about burning up calories when I exercise.",
    "Other people think that I am too thin.",
    "I am preoccupied with the thought of having fat on my body.",
    "I take longer than others to eat my meals.",
    "I avoid foods with sugar in them.",
    "I eat diet foods.",
    "I feel that food controls my life.",
    "I display self-control around food.",
    "I feel that others pressure me to eat.",
    "I give too much time and thought to food.",
    "I feel uncomfortable after eating sweets.",
    "I engage in dieting behavior.",
    "I like my stomach to be empty.",
    "I enjoy trying new rich foods.",
    "I have the impulse to vomit after meals."
];

const PHASES = [
    { 
        id: 'Mood', 
        label: 'Mindset & Energy', 
        icon: '🧠', 
        questions: phq9Questions, 
        type: 'scale',
        options: ['Not at all (0 days)', 'Several days (2-6 days)', 'More than half (7-11 days)', 'Nearly every day (12-14 days)'],
        overview: "We are assessing your 'Metabolic-Mood Axis'. Insulin resistance often masks itself as mental fatigue or low motivation. Addressing these signals is essential for a successful protocol."
    },
    { 
        id: 'Eating Behaviors', 
        label: 'Food Relationship', 
        icon: '⚖️', 
        questions: besQuestions, 
        type: 'choice',
        overview: "This section explores your 'Impulse Architecture'. GLP-1 medications target the brain's satiety centers to quiet 'food noise' and support regulated, intuitive eating patterns."
    },
    { 
        id: 'Daily Habits', 
        label: 'Lifestyle Rhythm', 
        icon: '📅', 
        questions: eat26Questions, 
        type: 'scale',
        options: ['Always', 'Usually', 'Often', 'Sometimes', 'Rarely', 'Never'],
        overview: "Finally, we examine your daily nutritional surveillance and behavioral rhythm. This ensures we tailor your protocol for sustainable, long-term metabolic health."
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

const showVisualTool: FunctionDeclaration = {
    name: 'showVisual',
    parameters: {
        type: Type.OBJECT,
        properties: {
            mode: { type: Type.STRING, enum: ['intro', 'interview', 'review'] }
        },
        required: ['mode']
    }
};

const setPhaseTool: FunctionDeclaration = {
    name: 'setPhase',
    parameters: {
        type: Type.OBJECT,
        properties: {
            phaseId: { type: Type.STRING, enum: ['Mood', 'Eating Behaviors', 'Daily Habits'] }
        },
        required: ['phaseId']
    }
};

const PsychoProfiler: React.FC<{ patient: Patient; onClose: () => void; onComplete: (data: any) => void }> = ({ patient, onClose, onComplete }) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const [agentVolume, setAgentVolume] = useState(0);
    const [visualMode, setVisualMode] = useState<string>('intro');
    const [activePhaseIndex, setActivePhaseIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});

    const audioContextRef = useRef<AudioContext | null>(null);
    const sessionRef = useRef<any | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
    const nextStartTimeRef = useRef<number>(0);
    const cardScrollRef = useRef<HTMLDivElement>(null);

    const activePhase = PHASES[activePhaseIndex];

    const handleNextPhase = () => {
        if (activePhaseIndex < PHASES.length - 1) {
            const nextIdx = activePhaseIndex + 1;
            setActivePhaseIndex(nextIdx);
            if (cardScrollRef.current) cardScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            sessionRef.current?.sendRealtimeInput({ text: `User clicked NEXT button. I am now showing the ${PHASES[nextIdx].label} questionnaire. Please provide a high-level clinical overview of why we study this.` });
        } else {
            setVisualMode('review');
            if (cardScrollRef.current) cardScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            sessionRef.current?.sendRealtimeInput({ text: `User clicked NEXT on the final section. Please wrap up the session and confirm we are reviewing the results.` });
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
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        tools: [{ functionDeclarations: [showVisualTool, setPhaseTool] }],
                        systemInstruction: `You are a Behavioral Wellness Lead at Vita. 
                        
                        LANGUAGE: Indian Professional English.
                        TONE: Professional, intellectual, clinical, yet warm and Address the user as Sir/Ma'am.

                        WORKFLOW:
                        1. Mindset & Energy (PHQ-9)
                        2. Food Relationship (BES)
                        3. Lifestyle Rhythm (EAT-26)

                        AGENT PROTOCOL:
                        - When a new assessment card is shown, provide a brief (2-3 sentence) clinical overview of why the area is relevant to metabolic health.
                        - DO NOT read the questions. Sir/Ma'am will complete them manually on the screen.
                        - When they click 'Next', acknowledge the transition and provide the overview for the next section.
                        - Start by calling showVisual('interview') and setPhase('Mood').`
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
                                src.start(start); nextStartTimeRef.current = start + buf.duration;
                                setIsAgentSpeaking(true); sourceNodesRef.current.push(src);
                                src.onended = () => { 
                                    sourceNodesRef.current = sourceNodesRef.current.filter(s => s !== src); 
                                    if (sourceNodesRef.current.length === 0) setIsAgentSpeaking(false);
                                };
                            }
                            if (msg.toolCall) {
                                msg.toolCall.functionCalls.forEach(call => {
                                    if (call.name === 'showVisual') setVisualMode(call.args.mode as string);
                                    else if (call.name === 'setPhase') {
                                        const idx = PHASES.findIndex(p => p.id === call.args.phaseId);
                                        if (idx !== -1) setActivePhaseIndex(idx);
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
            } catch (e) {}
        };
        init();
        return () => { if (sessionRef.current) sessionRef.current.close(); };
    }, [hasStarted]);

    useEffect(() => {
        const update = () => {
            if (analyserRef.current) {
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b) / data.length;
                setAgentVolume(avg / 128); 
            }
            requestAnimationFrame(update);
        };
        update();
    }, []);

    const renderQuestionnaire = () => {
        return (
            <div className="space-y-6 pb-12">
                {activePhase.questions.map((q: any, idx: number) => {
                    const questionKey = `${activePhase.id}_${idx}`;
                    const currentVal = responses[questionKey];
                    const isBes = activePhase.id === 'Eating Behaviors';
                    const label = isBes ? q.label : `Question ${idx + 1}`;
                    const text = isBes ? `Topic: ${label}` : q;

                    return (
                        <div key={idx} className={`p-6 rounded-3xl border transition-all duration-300 ${currentVal ? 'bg-brand-pink/5 border-brand-pink/20' : 'bg-white/[0.02] border-white/10'}`}>
                            {isBes && (
                                <p className="text-[10px] font-black uppercase text-brand-pink tracking-widest mb-2 opacity-70">
                                    {label}
                                </p>
                            )}
                            <p className={`text-sm font-bold mb-4 leading-relaxed ${currentVal ? 'text-white' : 'text-gray-300'}`}>
                                {isBes ? "Select the statement that fits best:" : text}
                            </p>
                            <div className="flex flex-col gap-2">
                                {(isBes ? (q as any).options : activePhase.options).map((opt: string, oIdx: number) => (
                                    <button
                                        key={oIdx}
                                        onClick={() => setResponses(prev => ({ ...prev, [questionKey]: opt }))}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-medium leading-normal border transition-all ${currentVal === opt ? 'bg-brand-pink border-brand-pink text-black font-black' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col font-sans overflow-hidden">
             {!hasStarted && (
                 <div className="absolute inset-0 z-[60] bg-black/95 flex items-center justify-center p-10 text-center backdrop-blur-3xl animate-fade-in">
                    <div className="bg-gray-900 p-16 rounded-[70px] border border-white/10 max-w-sm shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-pink to-brand-purple"></div>
                        <h2 className="text-4xl font-black mb-10 text-brand-pink tracking-tighter uppercase leading-none">Inner <br/> Flow Assessment</h2>
                        <button onClick={() => setHasStarted(true)} className="w-full py-7 bg-brand-pink text-white font-black rounded-[32px] uppercase tracking-[0.3em] text-[10px] shadow-[0_0_25px_rgba(249,168,212,0.3)]">Authorize Link</button>
                        <button onClick={onClose} className="mt-8 text-[9px] font-black uppercase text-gray-500 tracking-[0.4em] hover:text-white transition-colors">Abort</button>
                    </div>
                 </div>
             )}
            
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-[55] flex flex-col items-center gap-6 py-10">
                <div className="text-[8px] font-black uppercase tracking-[0.6em] text-brand-pink/40 rotate-180 [writing-mode:vertical-lr] mb-4">Clinical Depth</div>
                <div className="w-[1.5px] h-64 bg-white/5 relative rounded-full">
                    <div 
                        className="absolute top-0 w-full bg-brand-pink shadow-[0_0_15px_#F9A8D4] transition-all duration-1000 ease-in-out" 
                        style={{ height: `${((activePhaseIndex + 1) / PHASES.length) * 100}%` }}
                    />
                </div>
                <div className="flex flex-col gap-4 mt-2">
                    {PHASES.map((p, i) => (
                        <div key={p.id} className={`w-2 h-2 rounded-full transition-all duration-700 ${i <= activePhaseIndex ? 'bg-brand-pink scale-110 shadow-[0_0_10px_#F9A8D4]' : 'bg-white/5'}`} title={p.label}></div>
                    ))}
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-center p-10 border-b border-white/5 ml-16">
                <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_15px_#4ade80]' : 'bg-yellow-400 animate-pulse'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Clinical Uplink Established</span>
                </div>
                <button onClick={onClose} className="px-6 py-2.5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Close</button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-10 ml-16">
                <div className="w-full max-w-md h-[680px] bg-white/[0.02] border border-white/10 rounded-[60px] backdrop-blur-3xl overflow-hidden relative shadow-2xl flex flex-col transition-all duration-500 transform translate-y-[-2%]">
                    <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">{activePhase.label}</h3>
                        <span className="text-sm">{activePhase.icon}</span>
                    </div>
                    
                    <div ref={cardScrollRef} className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
                        {visualMode === 'intro' && (
                            <div className="p-12 text-center flex flex-col items-center justify-center h-full animate-fade-in">
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">Starting Your <br/>Wellness <br/> Profile</h3>
                                <p className="text-sm text-gray-500 mt-6 leading-relaxed">The Behavioral Lead will provide overviews of each area. Please scroll and complete the clinical questionnaires below.</p>
                            </div>
                        )}
                        
                        {(visualMode === 'interview' || visualMode === 'review') && (
                            <div className="animate-fade-in flex flex-col min-h-full">
                                <div className="mb-10">
                                    <h4 className="text-lg font-black text-white mb-3 flex items-center gap-3">
                                        <span className="text-brand-pink">{activePhase.icon}</span> {activePhase.label}
                                    </h4>
                                    <p className="text-xs text-brand-pink/80 leading-relaxed font-medium bg-brand-pink/5 border-l-2 border-brand-pink/40 pl-5 py-3 rounded-r-xl">
                                        {activePhase.overview}
                                    </p>
                                </div>
                                
                                {renderQuestionnaire()}

                                <div className="mt-auto pt-8 border-t border-white/5 shrink-0 bg-gradient-to-t from-gray-900 to-transparent sticky bottom-0">
                                    {visualMode === 'review' ? (
                                        <button onClick={() => onComplete(responses)} className="w-full py-6 bg-brand-pink text-black font-black rounded-3xl uppercase tracking-[0.3em] text-[10px] shadow-[0_0_30px_rgba(249,168,212,0.4)] hover:scale-105 active:scale-95 transition-all">Submit Profiles</button>
                                    ) : (
                                        <button 
                                            onClick={handleNextPhase} 
                                            className="w-full py-5 bg-white text-black font-black rounded-3xl uppercase tracking-[0.3em] text-[10px] hover:bg-brand-pink hover:text-black transition-all shadow-xl flex items-center justify-center gap-2 group"
                                        >
                                            {activePhaseIndex < PHASES.length - 1 ? 'Next Assessment' : 'Finish Flow'} <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-10 right-10 z-[60] flex flex-col items-center gap-4 group">
                <div className="flex gap-1.5 h-8 items-center mb-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1 bg-brand-pink rounded-full transition-all duration-100" 
                             style={{ 
                                height: `${Math.max(4, agentVolume * 80 * (Math.random() + 0.3))}px`,
                                opacity: isAgentSpeaking ? 1 : 0.1
                             }}
                        ></div>
                    ))}
                </div>
                <div className="relative">
                    <div className={`w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-brand-pink to-brand-purple shadow-2xl transition-all duration-700 ${isAgentSpeaking ? 'scale-110 shadow-[0_0_30px_rgba(249,168,212,0.5)]' : 'scale-100 opacity-80'}`}>
                        <img src={AGENT_AVATAR} className="w-full h-full rounded-full object-cover grayscale-[10%]" alt="Vita" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-pink rounded-full border-2 border-black flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-ping"></div>
                    </div>
                </div>
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/40">Behavioral Lead</p>
            </div>
        </div>
    );
};

export default PsychoProfiler;
