
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import { auth } from '../firebase';
import { Patient, VitaLogo } from '../constants';
import LabScheduler from '../components/dashboard/LabScheduler';
import ConsultationScheduler from '../components/dashboard/ConsultationScheduler';
import SideMenu from '../components/dashboard/SideMenu';

// --- Type Definitions for Speech API ---
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: any) => void;
    onend: () => void;
    onerror: (event: any) => void;
}
declare global {
    interface Window {
        SpeechRecognition?: any;
        webkitSpeechRecognition?: any;
    }
}

// --- Component Types ---
type DashboardView = 'dashboard' | 'profile' | 'reports' | 'payments' | 'care_team' | 'help' | 'live';

const CARE_MANAGER = {
    id: 'coordinator',
    name: 'Alex Ray',
    role: 'Care Manager',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop',
    color: 'text-brand-cyan'
};

type WidgetType = 'vitals' | 'medical' | 'psych' | 'labs' | 'profile' | 'payment' | 'consultation';

interface Message {
    sender: string;
    text?: string;
    audioUrl?: string; // For async voice messages
    role?: string;
    avatar?: string;
    color?: string;
    isConnecting?: boolean;
    widget?: {
        type: WidgetType;
        isComplete: boolean;
        data?: any;
    };
}

const triggerWidgetTool: FunctionDeclaration = {
    name: 'triggerWidget',
    description: 'Triggers a specific UI widget for the user to interact with. Use this to collect structured data.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            widgetType: { type: Type.STRING, enum: ['vitals', 'medical', 'psych', 'labs', 'profile', 'payment', 'consultation'] }
        },
        required: ['widgetType']
    }
};

interface PatientLiveProps {
    patient: Patient;
    onNavigate: (view: DashboardView) => void;
    onUpdatePatient?: any;
    onSignOut: () => void;
}

const PatientLive: React.FC<PatientLiveProps> = ({ patient, onNavigate, onUpdatePatient, onSignOut }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: CARE_MANAGER.name,
            role: CARE_MANAGER.role,
            avatar: CARE_MANAGER.avatar,
            color: CARE_MANAGER.color,
            text: "Establishing secure connection...",
            isConnecting: true
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [onboardingProgress, setOnboardingProgress] = useState(() => {
        if (patient.status === 'Ongoing Treatment' || patient.status === 'Monitoring Loop') return 100;
        const pMap: Record<string, number> = { 'Assessment Review': 20, 'Labs Ordered': 60, 'Ready for Consult': 90 };
        return pMap[patient.status] || 0;
    });
    const [scheduledLabDate, setScheduledLabDate] = useState<Date | null>(null);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => {
        return ['Ongoing Treatment', 'Monitoring Loop', 'Awaiting Shipment'].includes(patient.status);
    });
    const [patientSex, setPatientSex] = useState<string>(''); // Lifted state for conditional logic

    // Chat State
    const [chatSession, setChatSession] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);

    // Voice State
    const [isListening, setIsListening] = useState(false); // Dictation
    const [isRecording, setIsRecording] = useState(false); // Voice Note
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const initRun = useRef(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

    // --- Initialize Chat ---
    useEffect(() => {
        const fetchHistory = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                const token = await user.getIdToken();
                const response = await fetch(`${API_BASE_URL}/api/data`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const cloudData = await response.json();
                    if (cloudData.chat_history && Array.isArray(cloudData.chat_history.messages) && cloudData.chat_history.messages.length > 0) {
                        setMessages(cloudData.chat_history.messages);
                        return true; // Found history
                    }
                }
            } catch (err) {
                console.error("Failed to fetch chat history:", err);
            }
            return false;
        };

        let ignore = false;

        const initChat = async () => {
            if (ignore) return;
            try {
                const hasHistory = await fetchHistory();
                if (ignore) return;

                const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
                const chat = ai.chats.create({
                    model: 'gemini-3-flash-preview',
                    config: {
                        systemInstruction: `You are Alex Ray, the Vita Care Manager. You are guiding ${patient.name || 'the patient'} through the intake process.

                        **TONE:** Professional, warm, efficient. Indian English nuance (use "Kindly", "Right then", "Please do the needful").
                        
                        **PROTOCOL:**
                        1. **EXPLAIN FIRST**: Always explain *why* we need data before asking for it.
                        2. **TRIGGER WIDGET**: Call the \`triggerWidget\` tool to show the form. 
                           - **IMPORTANT**: Do not print the JSON. You must EXECUTE the function \`triggerWidget\`. 
                           - If you need to verify vitals, call triggerWidget({ widgetType: 'vitals' }).
                        3. **WAIT**: Once a widget is triggered, stop generating and wait for the system to confirm capture.
                        
                        **SEQUENCE:**
                        1. **INTRO -> VITALS**: Explain BMI, Visceral Fat, and Body Composition. Ask for age, sex, and detailed measurements including neck, hip, and waist for accurate analysis. Tool: 'vitals'.
                        2. **MEDICAL**: Explain safety/contraindications. Tool: 'medical'.
                        3. **PSYCH**: Explain brain-gut connection. Tool: 'psych'.
                        4. **LABS**: Explain baseline safety. Tool: 'labs'.
                        5. **PROFILE**: Explain shipping logistics. Tool: 'profile'.
                        6. **PAYMENT**: Explain commitment. Tool: 'payment'.
                        7. **CONSULT**: Explain doctor review. Tool: 'consultation'.
                        8. **DONE**: Open Q&A.
                        
                        Do not hallucinate that steps are done. Wait for "SYSTEM: Captured..." messages.
                        `,
                        tools: [{ functionDeclarations: [triggerWidgetTool] }],
                    },
                });

                setChatSession(chat);

                if (!hasHistory) {
                    // Kickoff for new user
                    setIsTyping(true);
                    const res = await chat.sendMessage({ message: "SYSTEM: Session Start. Introduce yourself and start Step 1." });
                    if (!ignore) processResponse(res);
                } else {
                    // For existing users, we inform the AI about current state
                    const res = await chat.sendMessage({ message: `SYSTEM: Session Load. User is returning. Current progress is ${onboardingProgress}%. Check messages for context.` });
                    // We don't necessarily need to process the response if we just want it to be ready
                }
            } catch (e) {
                console.error("Chat Init Error", e);
                setMessages(prev => [...prev, { sender: 'System', text: 'Connection failed. Please refresh.' }]);
            }
        };

        if (patient) {
            initChat();
        }

        return () => {
            ignore = true;
        };
    }, [patient.id]);

    // Sync messages to Cloud
    useEffect(() => {
        if (messages.length > 1) { // Only sync if more than the initial message
            saveToCloudBucket('chat_history', { messages });
        }
    }, [messages]);

    // --- Voice Dictation Setup ---
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');
                setInputValue(transcript);
            };

            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
    }, []);

    const toggleDictation = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setInputValue('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    // --- Async Voice Message Setup ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' }); // Gemini supports mp3/wav/aac/etc.
                const audioUrl = URL.createObjectURL(audioBlob);

                // Add to UI
                setMessages(prev => [...prev, { sender: 'You', audioUrl }]);

                // Send to Gemini
                await sendAudioMessage(audioBlob);
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stop stream tracks
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
    };

    // --- Message Handling ---

    const processResponse = async (res: any) => {
        setIsTyping(false);
        const text = res.text || "";
        let calls = res.functionCalls;

        // --- ROBUST FALLBACK PARSING ---
        if (!calls || calls.length === 0) {
            try {
                const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/i);
                if (jsonBlockMatch) {
                    try {
                        const parsed = JSON.parse(jsonBlockMatch[1]);
                        if (parsed.tool_calls) {
                            calls = parsed.tool_calls.map((tc: any) => ({ name: tc.function.name, args: tc.function.parameters }));
                        } else if (parsed.function) {
                            calls = [{ name: parsed.function.name, args: parsed.function.parameters }];
                        } else if (parsed.name === 'triggerWidget') {
                            calls = [{ name: parsed.name, args: parsed.parameters || parsed.args }];
                        } else if (parsed.widget_type || parsed.widgetType) {
                            calls = [{ name: 'triggerWidget', args: { widgetType: parsed.widget_type || parsed.widgetType } }];
                        } else if (Array.isArray(parsed)) {
                            calls = parsed.map((p: any) => ({ name: p.name || p.function?.name || 'triggerWidget', args: p.args || p.parameters || p.function?.parameters || p })).filter(c => c.args?.widgetType || c.args?.widget_type);
                        }
                    } catch (e) { /* ignore */ }
                }
                if (!calls && (text.includes('tool_calls') || text.includes('widget_type') || text.includes('widgetType'))) {
                    const looseMatch = text.match(/(\{[\s\S]*?(?:"widget_type"|"widgetType")[\s\S]*?\})/);
                    if (looseMatch) {
                        try {
                            const parsed = JSON.parse(looseMatch[1]);
                            if (parsed.tool_calls) {
                                calls = parsed.tool_calls.map((tc: any) => ({ name: tc.function.name, args: tc.function.parameters }));
                            } else if (parsed.widget_type || parsed.widgetType) {
                                calls = [{ name: 'triggerWidget', args: { widgetType: parsed.widget_type || parsed.widgetType } }];
                            }
                        } catch (e) { /* ignore */ }
                    }
                }
            } catch (e) { console.warn("Fallback Tool Parsing Failed:", e); }
        }

        if (calls) {
            calls = calls.map((c: any) => ({ ...c, args: { widgetType: c.args.widgetType || c.args.widget_type } }));
        }

        if (text) {
            let cleanText = text
                .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '')
                .replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/gi, '')
                .replace(/\{[\s\S]*?"tool_calls"[\s\S]*?\}/gi, '')
                .replace(/\{[\s\S]*?"widget_type"[\s\S]*?\}/gi, '')
                .replace(/\{[\s\S]*?"widgetType"[\s\S]*?\}/gi, '')
                .trim();

            if (cleanText) {
                setMessages(prev => {
                    const filtered = prev.filter(m => !m.isConnecting);
                    return [...filtered, {
                        sender: CARE_MANAGER.name,
                        role: CARE_MANAGER.role,
                        avatar: CARE_MANAGER.avatar,
                        color: CARE_MANAGER.color,
                        text: cleanText
                    }];
                });
            }
        }

        if (calls && calls.length > 0) {
            for (const call of calls) {
                if (call.name === 'triggerWidget') {
                    const wType = call.args.widgetType as WidgetType;
                    const pMap = { vitals: 0, medical: 20, psych: 40, labs: 60, profile: 75, payment: 85, consultation: 95 };
                    setOnboardingProgress(pMap[wType] || 0);

                    setMessages(prev => [...prev, {
                        sender: CARE_MANAGER.name,
                        role: CARE_MANAGER.role,
                        avatar: CARE_MANAGER.avatar,
                        color: CARE_MANAGER.color,
                        widget: { type: wType, isComplete: false }
                    }]);
                }
            }
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || !chatSession) return;

        if (isListening) toggleDictation(); // Stop listening if sending

        const text = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { sender: 'You', text }]);
        setIsTyping(true);

        try {
            const res = await chatSession.sendMessage({ message: text });
            processResponse(res);
        } catch (err) {
            setIsTyping(false);
            console.error("Send Error", err);
        }
    };

    const sendAudioMessage = async (audioBlob: Blob) => {
        if (!chatSession) return;
        setIsTyping(true);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            try {
                const res = await chatSession.sendMessage({
                    message: [
                        { text: "I have sent a voice message. Please listen and respond." },
                        { inlineData: { mimeType: "audio/mp3", data: base64data } }
                    ]
                });
                processResponse(res);
            } catch (err) {
                console.error("Audio Send Error", err);
                setIsTyping(false);
            }
        };
    };

    // --- Cloud Bucket Sync ---
    const saveToCloudBucket = async (section: string, data: any) => {
        const user = auth.currentUser;
        console.log("💾 Attempting sync for:", section, "User authenticated:", !!user);

        if (!user) {
            console.warn("No authenticated user found. Skipping sync.");
            return;
        }

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const token = await user.getIdToken();
            const payload = { section, data };

            // Using our local backend sync endpoint
            const CLOUD_ENDPOINT = `${API_BASE_URL}/api/sync`;

            console.log("☁️ Sending to Backend:", CLOUD_ENDPOINT);

            const response = await fetch(CLOUD_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Sync failed (${response.status}): ${errorText}`);
            }

            console.log("✅ Sync successful for section:", section);
        } catch (error) {
            console.error("❌ Cloud Sync Error:", error);
        }
    };

    // --- Widget Logic ---

    const handleWidgetSubmit = async (type: WidgetType, data: any, messageIndex: number) => {
        // Enforce status consistency for Move-and-Delete workflow
        const submitData = { ...data };
        if (type === 'labs' || type === 'consultation') {
            submitData.status = 'booked';
        }

        // 1. Sync data to Google Cloud Bucket
        saveToCloudBucket(type, submitData);

        // 2. Handle side effects like setting sex from vitals
        if (type === 'vitals' && data.sex) {
            setPatientSex(data.sex);
        }

        // 3. Update UI
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[messageIndex] = { ...newMessages[messageIndex], widget: { ...newMessages[messageIndex].widget!, isComplete: true, data } };
            return newMessages;
        });

        // 4. Update Progress
        let nextProgress = onboardingProgress + 10;
        if (type === 'consultation') {
            nextProgress = 100;
            setIsOnboardingComplete(true);
        }
        setOnboardingProgress(Math.min(nextProgress, 100));

        // Sync progress to profile
        if (onUpdatePatient) {
            const updates: any = {};
            if (type === 'consultation' || nextProgress === 100) updates.status = 'Awaiting Shipment';
            else if (type === 'vitals') updates.status = 'Assessment Review';
            else if (type === 'labs') updates.status = 'Ready for Consult';

            let event = null;
            if (type === 'medical') {
                event = {
                    type: 'Assessment',
                    title: 'Digital Data Intake Completed',
                    description: 'Patient completed intake assessment via Live chat.',
                    doctor: 'Vita AI'
                };
            }
            onUpdatePatient(patient.id, event, updates);
        }

        // 5. Format system message
        let detailsString = "";
        if (type === 'vitals') {
            const bp = (data.bp_sys && data.bp_dia) ? `BP:${data.bp_sys}/${data.bp_dia}` : '';
            detailsString = `(W:${data.current_weight}kg, Age:${data.age}, Sex:${data.sex}, Waist:${data.waist}in, Hip:${data.hip}in, Neck:${data.neck}in ${bp})`;
        }
        if (type === 'medical') {
            detailsString = `(DNA: Completed, Family: Completed, GLP-Suitability: Checked)`;
        }
        if (type === 'labs') {
            const labD = new Date(data.date);
            setScheduledLabDate(labD);
            detailsString = `(Scheduled: ${labD.toLocaleDateString()} ${data.time})`;
        }
        if (type === 'profile') detailsString = `(Profile: ${data.name}, ${data.shippingAddress?.city})`;
        if (type === 'payment') detailsString = `(Paid: ₹${data.amount})`;
        if (type === 'consultation') detailsString = `(Booked: ${data.date} ${data.time})`;

        // 6. Send confirmation to AI
        if (chatSession) {
            setIsTyping(true);
            const statusText = `SYSTEM: Captured ${type} data ${detailsString}. Widget complete. Proceed to next step.`;
            try {
                const res = await chatSession.sendMessage({ message: statusText });
                processResponse(res);
            } catch (error) {
                console.error("AI Ack Failed:", error);
                setIsTyping(false);
                // Fallback: If AI fails, forcefully trigger next step
                const wType = type as WidgetType;
                const widgetOrder: WidgetType[] = ['vitals', 'medical', 'psych', 'labs', 'profile', 'payment', 'consultation'];
                const currentIndex = widgetOrder.indexOf(wType);
                if (currentIndex !== -1 && currentIndex < widgetOrder.length - 1) {
                    const nextWidget = widgetOrder[currentIndex + 1];
                    console.log("Error Fallback triggering next widget:", nextWidget);
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            sender: CARE_MANAGER.name,
                            role: CARE_MANAGER.role,
                            avatar: CARE_MANAGER.avatar,
                            color: CARE_MANAGER.color,
                            text: "System: Connection unstable. Proceeding to next step manually.",
                            widget: { type: nextWidget, isComplete: false }
                        }]);
                    }, 1000);
                }
            }
        } else {
            console.warn("⚠️ Chat Session lost. Attempting to recover or manual progress.");
            // Determine next widget manually based on map
            const wType = type as WidgetType;
            const widgetOrder: WidgetType[] = ['vitals', 'medical', 'psych', 'labs', 'profile', 'payment', 'consultation'];
            const currentIndex = widgetOrder.indexOf(wType);
            if (currentIndex !== -1 && currentIndex < widgetOrder.length - 1) {
                const nextWidget = widgetOrder[currentIndex + 1];
                console.log("Fallback triggering next widget:", nextWidget);
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        sender: CARE_MANAGER.name,
                        role: CARE_MANAGER.role,
                        avatar: CARE_MANAGER.avatar,
                        color: CARE_MANAGER.color,
                        text: "Data recorded. Let's move to the next section.",
                        widget: { type: nextWidget, isComplete: false }
                    }]);
                }, 1000);
            }
        }

        // 7. Parent Update
        if (onUpdatePatient) {
            if (type === 'vitals') onUpdatePatient(patient.id, null, { vitals: [{ label: 'Weight', value: data.current_weight, unit: 'kg', date: new Date().toLocaleDateString() }] });
            if (type === 'profile') onUpdatePatient(patient.id, null, {
                name: data.name,
                email: data.email,
                phone: data.phone,
                shippingAddress: data.shippingAddress
            });
            if (type === 'labs' || type === 'consultation') {
                onUpdatePatient(patient.id, null, {
                    tracking: {
                        ...patient.tracking,
                        [type]: submitData
                    }
                });
            }
        }
    };

    const handleWidgetEdit = (messageIndex: number) => {
        setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[messageIndex].widget) {
                newMessages[messageIndex].widget!.isComplete = false;
            }
            return newMessages;
        });
    };

    const starterChips = ["What should I eat?", "Side effects?", "How do GLP-1s work?", "My next steps?"];

    return (
        <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col font-sans overflow-hidden animate-fade-in">
            <SideMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onSignOut={onSignOut}
                onNavigate={(view) => { onNavigate(view as any); setIsMenuOpen(false); }}
                currentView={'live' as any}
            />

            {/* Header */}
            <header className="bg-white border-b border-gray-100 p-6 flex justify-between items-center shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <VitaLogo />
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900">{CARE_MANAGER.name}</p>
                        <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">Lead Coordinator</p>
                    </div>
                    <div className={`w-11 h-11 rounded-full border-2 border-brand-cyan/20 overflow-hidden shadow-sm`}>
                        <img src={CARE_MANAGER.avatar} className="w-full h-full object-cover" alt={CARE_MANAGER.name} />
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            {!isOnboardingComplete && (
                <div className="w-full h-1 bg-gray-100 shrink-0">
                    <div className="h-full bg-brand-cyan shadow-[0_0_10px_rgba(94,234,212,0.5)] transition-all duration-1000 ease-out" style={{ width: `${onboardingProgress}%` }}></div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 no-scrollbar bg-gray-50/50">
                <div className="max-w-2xl mx-auto flex flex-col gap-6 w-full overflow-x-hidden">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 sm:gap-4 ${msg.sender === 'You' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                            {msg.avatar && <img src={msg.avatar} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 shadow-md border-2 border-white" alt={msg.sender} />}
                            <div className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                                {msg.role && <span className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${msg.color}`}>{msg.role}</span>}

                                {msg.text && (
                                    <div className={`p-4 sm:p-5 rounded-3xl text-sm leading-relaxed shadow-sm border ${msg.sender === 'You' ? 'bg-brand-purple text-white rounded-tr-none border-brand-purple/20' : 'bg-white text-gray-800 rounded-tl-none border-gray-100'} ${msg.isConnecting ? 'border-dashed border-brand-cyan/40 bg-brand-cyan/5' : ''}`}>
                                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                                    </div>
                                )}

                                {msg.audioUrl && (
                                    <div className="mt-2 bg-brand-purple text-white p-3 rounded-2xl rounded-tr-none flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Voice Note</span>
                                            <audio src={msg.audioUrl} controls className="h-6 w-32 opacity-80" />
                                        </div>
                                    </div>
                                )}

                                {msg.widget && (
                                    <div className="mt-3 w-full max-w-full">
                                        {msg.widget.isComplete ? (
                                            <div className="bg-white border border-gray-100 p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col gap-2 group relative">
                                                <button onClick={() => handleWidgetEdit(idx)} className="absolute top-4 right-4 text-xs font-bold text-gray-400 hover:text-brand-purple transition-colors">Edit</button>
                                                <div className="flex items-center gap-3 pr-8">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>
                                                    <div><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Captured</p><p className="text-xs sm:text-sm font-bold text-gray-800 capitalize">{msg.widget.type} Data</p></div>
                                                </div>
                                                {msg.widget.data && <div className="pl-11 text-xs text-gray-600 font-medium">Data saved to secure profile.</div>}
                                            </div>
                                        ) : (
                                            <div className="animate-slide-in-up w-full overflow-x-hidden">
                                                {msg.widget.type === 'vitals' && <VitalsWidget initialData={msg.widget.data} onSubmit={(d) => handleWidgetSubmit('vitals', d, idx)} />}
                                                {msg.widget.type === 'medical' && <MedicalOnboardingWidget initialData={msg.widget.data} patientSex={patientSex} onSubmit={(d) => handleWidgetSubmit('medical', d, idx)} />}
                                                {msg.widget.type === 'psych' && <PsychOnboardingWidget initialData={msg.widget.data} onSubmit={(d) => handleWidgetSubmit('psych', d, idx)} />}
                                                {msg.widget.type === 'labs' && <div className="bg-white p-4 sm:p-6 rounded-[32px] border border-gray-100 shadow-xl max-w-full"><LabScheduler onSchedule={(d) => handleWidgetSubmit('labs', d, idx)} /></div>}
                                                {msg.widget.type === 'profile' && <ProfileWidget initialData={msg.widget.data || patient} onSubmit={(d) => handleWidgetSubmit('profile', d, idx)} />}
                                                {msg.widget.type === 'payment' && <PaymentWidget onSubmit={(d) => handleWidgetSubmit('payment', d, idx)} />}
                                                {msg.widget.type === 'consultation' && (
                                                    <div className="bg-white p-4 sm:p-6 rounded-[32px] border border-gray-100 shadow-xl max-w-full">
                                                        <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tighter">Phase 7: Doctor Consultation</h3>
                                                        <ConsultationScheduler
                                                            onSchedule={(d) => handleWidgetSubmit('consultation', d, idx)}
                                                            minDate={scheduledLabDate ? new Date(new Date(scheduledLabDate).setDate(scheduledLabDate.getDate() + 5)) : undefined}
                                                            buttonText="Confirm Consultation"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-4 animate-fade-in">
                            <img src={CARE_MANAGER.avatar} className="w-10 h-10 rounded-full object-cover grayscale-[30%] opacity-50" />
                            <div className="bg-gray-100 p-4 rounded-3xl rounded-tl-none border border-gray-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 bg-white border-t border-gray-100 shrink-0 relative z-20">
                {isOnboardingComplete && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mt-2 justify-start sm:justify-center">
                        {starterChips.map(chip => (
                            <button key={chip} onClick={(e) => { setInputValue(chip); handleSendMessage(); }} className="flex-shrink-0 px-4 py-2 bg-brand-purple/5 text-brand-purple text-xs font-bold rounded-full hover:bg-brand-purple/10 transition-colors border border-brand-purple/20">{chip}</button>
                        ))}
                    </div>
                )}

                <div className="max-w-2xl mx-auto flex items-end gap-2">
                    <form onSubmit={handleSendMessage} className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 flex items-center focus-within:ring-2 focus-within:ring-brand-purple/20 transition-all overflow-hidden relative">
                        <input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Type or speak..."}
                            className="bg-transparent border-none outline-none w-full text-sm font-medium text-gray-700 placeholder-gray-400"
                        />
                        {/* Dictation Button */}
                        <button
                            type="button"
                            onClick={toggleDictation}
                            className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-gray-200'}`}
                            title="Dictate text"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </form>

                    {/* Async Voice Message Button */}
                    <button
                        type="button"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-cyan text-black hover:bg-brand-cyan/80'}`}
                        title="Hold to send voice note"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>

                    <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim()}
                        className="w-12 h-12 rounded-2xl bg-brand-text text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Comprehensive Onboarding Widgets ---

const VitalsWidget: React.FC<{ onSubmit: (d: any) => void; initialData?: any }> = ({ onSubmit, initialData }) => {
    const [d, setD] = useState(initialData || {
        height_ft: '5', height_in: '9', current_weight: '85', age: '', sex: '',
        waist: '', neck: '', hip: '',
        bp_sys: '', bp_dia: '', fat_mass: ''
    });
    const [showGuide, setShowGuide] = useState(false);

    return (
        <div className="bg-white p-5 sm:p-8 rounded-[32px] border border-gray-100 shadow-xl w-full max-w-full sm:max-w-md mx-auto overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Phase 1: Biometrics</h3>
                <button onClick={() => setShowGuide(!showGuide)} className="text-xs font-bold text-brand-purple bg-brand-purple/10 px-3 py-1.5 rounded-lg hover:bg-brand-purple/20 transition-colors">
                    {showGuide ? 'Hide Guide' : 'How to Measure?'}
                </button>
            </div>

            {showGuide && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-900 space-y-3 animate-fade-in">
                    <div>
                        <span className="font-bold block uppercase tracking-wide text-blue-800 mb-1">📏 Neck</span>
                        Measure just below your Adam's apple. Keep tape flat.
                    </div>
                    <div>
                        <span className="font-bold block uppercase tracking-wide text-blue-800 mb-1">📏 Waist</span>
                        Measure at your belly button or the narrowest part of your torso. Relax your stomach.
                    </div>
                    <div>
                        <span className="font-bold block uppercase tracking-wide text-blue-800 mb-1">📏 Hips</span>
                        Measure at the widest part of your buttocks/hips. Keep tape parallel to the floor.
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* Personal Info Group */}
                <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 border-b border-gray-100 pb-1">Personal Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Age</label>
                            <input type="number" value={d.age} onChange={e => setD({ ...d, age: e.target.value })} placeholder="30" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Sex</label>
                            <select value={d.sex} onChange={e => setD({ ...d, sex: e.target.value })} className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none h-[46px]">
                                <option value="" disabled>Select</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Body Composition Group */}
                <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 border-b border-gray-100 pb-1">Body Composition</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-xs font-bold text-gray-600 block mb-1">Height</label>
                            <div className="flex gap-2">
                                <input type="number" value={d.height_ft} onChange={e => setD({ ...d, height_ft: e.target.value })} placeholder="Ft" className="flex-1 bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none min-w-0" />
                                <input type="number" value={d.height_in} onChange={e => setD({ ...d, height_in: e.target.value })} placeholder="In" className="flex-1 bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none min-w-0" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Weight (kg)</label>
                            <input type="number" value={d.current_weight} onChange={e => setD({ ...d, current_weight: e.target.value })} placeholder="75" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Fat Mass % <span className="text-gray-400 font-normal">(Opt)</span></label>
                            <input type="number" value={d.fat_mass} onChange={e => setD({ ...d, fat_mass: e.target.value })} placeholder="25" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                        </div>
                    </div>
                </div>

                {/* Circumference Group */}
                <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 border-b border-gray-100 pb-1">Circumference (inches)</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Neck</label>
                            <input type="number" value={d.neck} onChange={e => setD({ ...d, neck: e.target.value })} placeholder="15" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Waist</label>
                            <input type="number" value={d.waist} onChange={e => setD({ ...d, waist: e.target.value })} placeholder="34" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">Hips</label>
                            <input type="number" value={d.hip} onChange={e => setD({ ...d, hip: e.target.value })} placeholder="40" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                        </div>
                    </div>
                </div>

                {/* Vitals Group */}
                <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 border-b border-gray-100 pb-1">Vitals (Optional)</h4>
                    <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Blood Pressure (mmHg)</label>
                        <div className="flex gap-2 items-center">
                            <input type="number" value={d.bp_sys} onChange={e => setD({ ...d, bp_sys: e.target.value })} placeholder="Sys (120)" className="flex-1 bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                            <span className="text-gray-400">/</span>
                            <input type="number" value={d.bp_dia} onChange={e => setD({ ...d, bp_dia: e.target.value })} placeholder="Dia (80)" className="flex-1 bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                        </div>
                    </div>
                </div>

                <button onClick={() => onSubmit(d)} disabled={!d.current_weight || !d.sex || !d.age} className="w-full py-4 bg-brand-text text-white font-black rounded-2xl uppercase tracking-widest text-[9px] shadow-lg disabled:opacity-30 hover:scale-[1.02] transition-transform">Submit Measurements</button>
            </div>
        </div>
    );
};

const MedicalOnboardingWidget: React.FC<{ onSubmit: (d: any) => void; initialData?: any; patientSex?: string }> = ({ onSubmit, initialData, patientSex }) => {
    const [step, setStep] = useState(0);
    const [d, setD] = useState(initialData || {
        t2d: null, hypertension: null, pcos: null, sleep_apnea: null, cholesterol: null, fatty_liver: null, thyroid_issues: null, medications: '', other_conditions: '',
        family_obesity: null, family_diabetes: null, family_cardio: null, family_thyroid: null,
        contra_mtc: null, contra_men2: null, contra_pancreatitis: null, contra_pregnancy: null, contra_suicide: null
    });

    const isFemale = patientSex === 'Female';

    const Toggle = ({ label, field }: { label: string, field: keyof typeof d }) => (
        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <span className="text-xs font-bold text-gray-600 pr-2">{label}</span>
            <div className="flex gap-2 shrink-0">
                <button onClick={() => setD({ ...d, [field]: true })} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${d[field] === true ? 'bg-brand-purple text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>Yes</button>
                <button onClick={() => setD({ ...d, [field]: false })} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${d[field] === false ? 'bg-brand-purple text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>No</button>
            </div>
        </div>
    );

    const stages = [
        {
            title: "Metabolic DNA", content: (
                <div className="space-y-1">
                    <Toggle label="Diagnosed with Type 2 Diabetes or Pre-diabetes?" field="t2d" />
                    <Toggle label="Managing High Blood Pressure with medication?" field="hypertension" />
                    <Toggle label="High Cholesterol or Statins use?" field="cholesterol" />
                    <Toggle label="Fatty Liver Disease (NAFLD/NASH)?" field="fatty_liver" />
                    <Toggle label="Thyroid Issues (Hypo/Hyper)?" field="thyroid_issues" />
                    {isFemale && <Toggle label="Diagnosed with PCOS or irregular periods?" field="pcos" />}
                    <Toggle label="Diagnosed with Sleep Apnea or use CPAP?" field="sleep_apnea" />
                    <div className="pt-4">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-2">Daily Meds & Supplements</label>
                        <textarea value={d.medications} onChange={e => setD({ ...d, medications: e.target.value })} placeholder="Current prescriptions..." className="w-full bg-gray-50 border rounded-xl p-3 text-sm min-h-[60px] outline-none focus:border-brand-purple resize-none" />
                    </div>
                    <div className="pt-2">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-2">Other Chronic Conditions</label>
                        <textarea value={d.other_conditions} onChange={e => setD({ ...d, other_conditions: e.target.value })} placeholder="Autoimmune, Kidney, etc..." className="w-full bg-gray-50 border rounded-xl p-3 text-sm min-h-[60px] outline-none focus:border-brand-purple resize-none" />
                    </div>
                </div>
            )
        },
        {
            title: "Family Legacy", content: (
                <div className="space-y-1">
                    <Toggle label="Family Obesity (BMI > 30)?" field="family_obesity" />
                    <Toggle label="Parent/Sibling with T2 Diabetes?" field="family_diabetes" />
                    <Toggle label="Early Heart Attack? (Men < 55, Women < 60)" field="family_cardio" />
                    <Toggle label="Thyroid Cancer History?" field="family_thyroid" />
                </div>
            )
        },
        {
            title: "GLP-1 Suitability", content: (
                <div className="space-y-1">
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-2">
                        <p className="text-[10px] text-red-700 font-bold uppercase tracking-wide">Safety Contraindications</p>
                    </div>
                    <Toggle label="MTC or MEN 2 History?" field="contra_mtc" />
                    <Toggle label="MEN 2 Syndrome?" field="contra_men2" />
                    <Toggle label="Hospitalized for Pancreatitis?" field="contra_pancreatitis" />
                    {isFemale && <Toggle label="Pregnant / Breastfeeding?" field="contra_pregnancy" />}
                    <Toggle label="Suicidal Ideation?" field="contra_suicide" />
                </div>
            )
        }
    ];

    return (
        <div className="bg-white p-5 sm:p-8 rounded-[32px] border border-gray-100 shadow-xl w-full max-w-full sm:max-w-md mx-auto overflow-hidden">
            <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tighter">Phase 2: {stages[step].title}</h3>
            <div className="mb-6">{stages[step].content}</div>
            <div className="flex gap-3">
                {step > 0 && <button onClick={() => setStep(step - 1)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-[9px]">Back</button>}
                {step < 2 ? (
                    <button onClick={() => setStep(step + 1)} className="flex-1 py-4 bg-brand-text text-white font-black rounded-2xl uppercase tracking-widest text-[9px] shadow-lg">Next Section</button>
                ) : (
                    <button onClick={() => onSubmit(d)} className="flex-1 py-4 bg-brand-text text-white font-black rounded-2xl uppercase tracking-widest text-[9px] shadow-lg">Finalize DNA</button>
                )}
            </div>
        </div>
    );
};

const PsychOnboardingWidget: React.FC<{ onSubmit: (d: any) => void; initialData?: any }> = ({ onSubmit, initialData }) => {
    const [subStage, setSubStage] = useState<'phq9' | 'bes' | 'eat26'>('phq9');
    const [qIndex, setQIndex] = useState(0);
    const [scores, setScores] = useState<Record<string, string>>(initialData || {});

    const phq9Questions = ["Little interest or pleasure", "Feeling down, depressed, hopeless", "Trouble falling/staying asleep", "Feeling tired or low energy", "Poor appetite or overeating", "Feeling bad about yourself", "Trouble concentrating", "Moving/speaking slowly", "Self-harm thoughts"];

    const besQuestions = [
        { id: 1, options: ["I don't feel self-conscious about my weight or body size when I'm with others.", "I feel concerned about how I look to others, but it normally doesn't make me feel disappointed with myself.", "I do get self-conscious about my appearance and weight which makes me feel disappointed in myself.", "I feel very self-conscious about my weight and frequently, I feel like I'm just failing at everything."] },
        { id: 2, options: ["I don't have any difficulty eating slowly in the proper manner.", "Although I seem to devour foods, I don't end up feeling stuffed because of eating too much.", "At times, I tend to eat quickly and then, I feel uncomfortably full afterwards.", "I have the habit of bolting down my food, without really chewing it. When this happens I usually feel uncomfortably stuffed because I've eaten too much."] },
        { id: 3, options: ["I feel capable to control my eating urges when I want to.", "I feel like I have failed to control my eating more than the average person.", "I feel utterly helpless when it comes to controlling my eating urges.", "Because I feel so helpless about controlling my eating I have become very desperate about trying to get in control."] },
        { id: 4, options: ["I don't have the habit of eating when I'm bored.", "I sometimes eat when I'm bored, but often I'm able to get busy and get my mind off food.", "I have a regular habit of eating when I'm bored, but occasionally, I can use some other activity to get my mind off it.", "I have a strong habit of eating when I'm bored. Nothing seems to help me break the habit."] },
        { id: 5, options: ["I'm usually physically hungry when I eat something.", "Occasionally, I eat something on impulse even though I'm not really hungry.", "I have the regular habit of eating foods, that I might not really enjoy, to satisfy a hungry feeling even though physically, I don't need the food.", "Even though I'm not physically hungry, I get a hungry feeling in my mouth that only seems to be satisfied when I eat a food."] },
        { id: 6, options: ["I don't feel any guilt or self-hate after I overeat.", "After I overeat, occasionally I feel guilt or self-hate.", "Almost all the time I experience strong guilt or self-hate after I overeat."] },
        { id: 7, options: ["I don't lose total control of my eating when dieting even after periods when I overeat.", "Sometimes when I eat a \"forbidden food\" on a diet, I feel like I blew it and eat even more.", "Frequently, I have the habit of saying to myself, \"I've blown it now, why not go all the way\" when I overeat on a diet."] },
        { id: 8, options: ["I rarely eat so much food that I feel uncomfortably stuffed afterwards.", "Usually about once a month, I eat such a quantity of food, I end up feeling very stuffed.", "I have regular periods during the month when I eat large amounts of food, either at mealtime or at snacks.", "I eat so much food that I regularly feel quite uncomfortable after eating."] }
    ];

    const eat26Questions = ["Terrified of overweight", "Avoid eating when hungry", "Food preoccupation", "Impulse to binge", "Cut food small", "Calorie awareness", "Avoid carbs", "Feel pressure to eat more", "Vomit after eating", "Guilt after eating"];

    const subStageLabels = {
        phq9: "Assessing Mood & Motivation",
        bes: "Food Relationship Check",
        eat26: "Eating Pattern Safety Screen"
    };

    const handleAnswer = (val: string) => {
        const key = `${subStage}_${qIndex}`;
        setScores({ ...scores, [key]: val });

        const activeList = subStage === 'phq9' ? phq9Questions : subStage === 'bes' ? besQuestions : eat26Questions;

        if (qIndex < activeList.length - 1) {
            setQIndex(qIndex + 1);
        } else {
            if (subStage === 'phq9') { setSubStage('bes'); setQIndex(0); }
            else if (subStage === 'bes') { setSubStage('eat26'); setQIndex(0); }
            else { onSubmit(scores); }
        }
    };

    const currentQuestion = subStage === 'phq9' ? phq9Questions[qIndex] : subStage === 'bes' ? `Situation ${qIndex + 1}: Select the statement that fits best.` : eat26Questions[qIndex];
    const options = subStage === 'phq9'
        ? ['Not at all', 'Several days', 'More than half', 'Nearly every day']
        : subStage === 'eat26'
            ? ['Always', 'Usually', 'Often', 'Sometimes', 'Rarely', 'Never']
            : besQuestions[qIndex].options;

    return (
        <div className="bg-white p-5 sm:p-8 rounded-[32px] border border-gray-100 shadow-xl w-full max-w-full sm:max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Phase 3: Psychographics</h3>
                    <p className="text-xs text-brand-purple/80 font-bold mt-1">{subStageLabels[subStage]}</p>
                </div>
                <span className="text-[8px] font-black uppercase text-brand-pink border border-brand-pink/30 px-2 py-1 rounded-full">{subStage.toUpperCase()}</span>
            </div>
            <div className="animate-fade-in min-h-[160px]" key={`${subStage}_${qIndex}`}>
                <h4 className="text-[10px] font-black text-brand-pink uppercase tracking-widest mb-1">Question {qIndex + 1} of {subStage === 'bes' ? besQuestions.length : subStage === 'phq9' ? phq9Questions.length : eat26Questions.length}</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed font-bold">{currentQuestion}</p>
                <div className="flex flex-col gap-2">
                    {options.map(v => (
                        <button key={v} onClick={() => handleAnswer(v)} className="w-full text-left p-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 hover:bg-brand-pink/10 hover:text-brand-pink transition-all border border-transparent hover:border-brand-pink/20">{v}</button>
                    ))}
                </div>
            </div>
            <div className="mt-6 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <div className="bg-brand-pink h-full transition-all duration-500" style={{ width: `${((qIndex + 1) / (subStage === 'bes' ? besQuestions.length : subStage === 'phq9' ? phq9Questions.length : eat26Questions.length)) * 100}%` }}></div>
            </div>
        </div>
    );
};

const ProfileWidget: React.FC<{ onSubmit: (d: any) => void, initialData: any }> = ({ onSubmit, initialData }) => {
    const [useSameAddress, setUseSameAddress] = useState(true);
    const [d, setD] = useState({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        labAddress: {
            line1: initialData.shippingAddress?.line1 || '',
            city: initialData.shippingAddress?.city || '',
            zip: initialData.shippingAddress?.zip || ''
        },
        shippingAddress: {
            line1: initialData.shippingAddress?.line1 || '',
            city: initialData.shippingAddress?.city || '',
            zip: initialData.shippingAddress?.zip || ''
        }
    });

    const updateLabAddress = (field: string, value: string) => {
        setD(prev => {
            const newData = { ...prev, labAddress: { ...prev.labAddress, [field]: value } };
            if (useSameAddress) {
                newData.shippingAddress = newData.labAddress;
            }
            return newData;
        });
    };

    const updateShippingAddress = (field: string, value: string) => {
        setD(prev => ({ ...prev, shippingAddress: { ...prev.shippingAddress, [field]: value } }));
    };

    const toggleSameAddress = () => {
        setUseSameAddress(!useSameAddress);
        if (!useSameAddress) {
            setD(prev => ({ ...prev, shippingAddress: prev.labAddress }));
        }
    };

    return (
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl w-full">
            <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tighter">Phase 5: Your Profile</h3>
            <div className="space-y-4">
                <input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} placeholder="Full Name" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                <input value={d.email} onChange={e => setD({ ...d, email: e.target.value })} placeholder="Email" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                <input value={d.phone} onChange={e => setD({ ...d, phone: e.target.value })} placeholder="Phone" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />

                <div className="pt-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Address for Lab Visit</p>
                    <input value={d.labAddress.line1} onChange={e => updateLabAddress('line1', e.target.value)} placeholder="Street Address" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none mb-2" />
                    <div className="flex gap-2">
                        <input value={d.labAddress.city} onChange={e => updateLabAddress('city', e.target.value)} placeholder="City" className="flex-1 bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                        <input value={d.labAddress.zip} onChange={e => updateLabAddress('zip', e.target.value)} placeholder="ZIP" className="w-24 bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="sameAddress" checked={useSameAddress} onChange={toggleSameAddress} className="w-4 h-4 text-brand-purple rounded border-gray-300 focus:ring-brand-purple" />
                        <label htmlFor="sameAddress" className="text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer">Use same address for Shipping</label>
                    </div>

                    {!useSameAddress && (
                        <div className="animate-fade-in space-y-2">
                            <input value={d.shippingAddress.line1} onChange={e => updateShippingAddress('line1', e.target.value)} placeholder="Shipping Street Address" className="w-full bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                            <div className="flex gap-2">
                                <input value={d.shippingAddress.city} onChange={e => updateShippingAddress('city', e.target.value)} placeholder="City" className="flex-1 bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                                <input value={d.shippingAddress.zip} onChange={e => updateShippingAddress('zip', e.target.value)} placeholder="ZIP" className="w-24 bg-gray-50 border rounded-xl p-3 text-sm focus:border-brand-purple outline-none" />
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={() => onSubmit(d)} className="w-full py-4 bg-brand-text text-white font-black rounded-2xl uppercase tracking-widest text-[9px] shadow-lg">Save Profile</button>
            </div>
        </div>
    );
}

const PaymentWidget: React.FC<{ onSubmit: (d: any) => void }> = ({ onSubmit }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const handlePay = () => {
        setIsProcessing(true);
        setTimeout(() => onSubmit({ amount: 3999, status: 'success' }), 2000);
    };

    if (isProcessing) return <div className="p-8 text-center bg-white rounded-[32px] border border-gray-100 shadow-xl"><p className="animate-pulse font-bold text-brand-purple">Processing Secure Payment...</p></div>;

    return (
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl w-full">
            <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tighter">Phase 6: Secure Spot</h3>
            <div className="bg-gray-50 p-4 rounded-2xl mb-6 space-y-2">
                <div className="flex justify-between text-sm font-medium text-gray-600"><span>Metabolic Lab Panel</span><span>₹2,499</span></div>
                <div className="flex justify-between text-sm font-medium text-gray-600"><span>Doctor Consultation</span><span>₹1,500</span></div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-brand-text"><span>Total</span><span>₹3,999</span></div>
            </div>
            <button onClick={handlePay} className="w-full py-4 bg-green-500 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] shadow-lg hover:bg-green-600 transition-all">Pay & Finish</button>
        </div>
    );
}

export default PatientLive;
