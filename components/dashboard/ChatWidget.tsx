
import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { VitaLogo, Patient, ChatAttachment as ChatAttachmentType } from '../../constants';
import FileUploadButton from '../messaging/FileUploadButton';
import ChatAttachment from '../messaging/ChatAttachment';

// Type definitions for Web Speech API
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
}

declare global {
    interface Window {
        SpeechRecognition?: any;
        webkitSpeechRecognition?: any;
    }
}


// SVG Icons defined within the component for simplicity
const ChatBubbleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const MicrophoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;


type MessageSender = 'patient' | 'bot' | 'system' | 'careCoordinator' | 'doctor';
type ActionLead = 'bot' | 'careTeam';

interface Message {
    sender: MessageSender;
    text: string;
    attachment?: ChatAttachmentType;
}

interface ChatContext {
    currentStep: string;
    isProfileComplete: boolean;
    missingFields: string[];
}

interface ChatWidgetProps {
    patient: Patient;
    isOpen: boolean;
    onClose: () => void;
    onOpen: () => void;
    context: ChatContext;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ patient, isOpen, onClose, onOpen, context }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: `Hi ${patient.name.split(' ')[0]}! I'm vita assist. How can I help you today?` }
    ]);
    const [actionLead, setActionLead] = useState<ActionLead>('bot');
    const [inputValue, setInputValue] = useState('');
    const [attachment, setAttachment] = useState<ChatAttachmentType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.onresult = (event: SpeechRecognitionEvent) => setInputValue(Array.from(event.results).map(r => r[0].transcript).join(''));
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => { console.error('Speech recognition error', event.error); setIsListening(false); };
            recognitionRef.current = recognition;
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleToggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setInputValue('');
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handleSwitchLead = (newLead: ActionLead) => {
        if (newLead === actionLead) return;

        setActionLead(newLead);
        let systemMsg = "";

        if (newLead === 'careTeam') {
            systemMsg = "Connecting you with your Care Team. We'll route your message to either your Doctor or Care Manager based on your needs.";
        } else {
            systemMsg = "Switched back to Vita AI.";
        }

        setMessages(prev => [...prev, { sender: 'system', text: systemMsg }]);
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (isListening) recognitionRef.current?.stop();
        if ((!inputValue.trim() && !attachment) || isLoading) return;

        const userMessage: Message = { sender: 'patient', text: inputValue, attachment: attachment || undefined };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setAttachment(null);
        setIsLoading(true);

        const lowerMsg = userMessage.text.toLowerCase();

        // MOCK RESPONSE LOGIC
        setTimeout(() => {

            // 1. Handle Human Mode (Care Team)
            if (actionLead === 'careTeam') {
                // Intelligent Routing Logic based on keywords
                const isMedical = lowerMsg.includes('pain') ||
                    lowerMsg.includes('nausea') ||
                    lowerMsg.includes('vomit') ||
                    lowerMsg.includes('sick') ||
                    lowerMsg.includes('dose') ||
                    lowerMsg.includes('medication') ||
                    lowerMsg.includes('side effect') ||
                    lowerMsg.includes('symptom');

                if (isMedical) {
                    setMessages(prev => [...prev, {
                        sender: 'doctor',
                        text: "This is Dr. Mitchell. I've received your message. Since this involves a clinical matter, I'm reviewing your chart now and will respond with guidance shortly."
                    }]);
                } else {
                    setMessages(prev => [...prev, {
                        sender: 'careCoordinator',
                        text: "Hi, this is Alex, your Care Manager. I've received your request and will get that sorted out for you right away."
                    }]);
                }
                setIsLoading(false);
                return;
            }

            // 2. Handle AI Mode (Default)

            // Check for Shipping
            if (lowerMsg.includes('shipping') || lowerMsg.includes('order') || lowerMsg.includes('arrive')) {
                setMessages(prev => [...prev, { sender: 'system', text: `Let me check that for you... Your next medication shipment is scheduled for ${new Date(new Date().setDate(new Date().getDate() + 5)).toLocaleDateString()}. You'll get an email with tracking info once it ships.` }]);
            }
            // Check for Human/Escalation
            else if (lowerMsg.includes('human') || lowerMsg.includes('help') || lowerMsg.includes('talk to someone') || lowerMsg.includes('doctor')) {
                setActionLead('careTeam');
                setMessages(prev => [...prev, { sender: 'system', text: `I understand. I'm connecting you with your Care Team now so a human can assist you.` }]);
            }
            // General Advice
            else if (lowerMsg.includes('diet') || lowerMsg.includes('eat')) {
                setMessages(prev => [...prev, { sender: 'bot', text: "Focus on protein and fiber-rich foods. Hydration is key! (Mock Advice)" }]);
            }
            // Default
            else {
                setMessages(prev => [...prev, { sender: 'bot', text: "I can help with shipping updates, billing questions, or guide you through the app. For complex requests, you can switch to the Care Team." }]);
            }

            setIsLoading(false);
        }, 1000);
    };

    const leadText: Record<ActionLead, string> = {
        bot: 'vita assist',
        careTeam: 'Care Team (Human)'
    };

    const senderStyles: Record<MessageSender, string> = {
        patient: 'bg-brand-purple text-white rounded-br-lg self-end',
        bot: 'bg-gray-200 text-brand-text rounded-bl-lg self-start',
        careCoordinator: 'bg-brand-cyan/20 text-brand-text rounded-bl-lg self-start border-l-4 border-brand-cyan',
        doctor: 'bg-brand-text text-white rounded-bl-lg self-start border-l-4 border-gray-500',
        system: 'bg-gray-100 border text-brand-text-light text-center w-full text-xs self-center',
    };

    return (
        <>
            <div className={`fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : ''}`}>
                <button
                    onClick={onOpen}
                    className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan rounded-full shadow-2xl animate-gradient-x hover:scale-105 transform transition-transform"
                    aria-label="Open vita assist chat"
                >
                    <ChatBubbleIcon />
                    <span className="text-white font-bold text-lg">vita assist</span>
                </button>
            </div>

            <div className={`fixed bottom-0 right-0 sm:bottom-8 sm:right-8 z-50 w-full h-full sm:w-[380px] sm:h-[70vh] sm:max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <header className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <VitaLogo />
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-brand-text -mb-1">vita assist</h3>
                            <p className="text-xs text-gray-500">Speaking with: <span className="font-semibold text-brand-purple">{leadText[actionLead]}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close chat">
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-1 p-4 overflow-y-auto bg-brand-bg/50" aria-live="polite">
                    <div className="flex flex-col gap-3">
                        {messages.map((msg, index) => (
                            <div key={index} className={`max-w-[85%] p-3 rounded-2xl text-sm ${senderStyles[msg.sender]}`}>
                                {msg.sender === 'doctor' && <div className="text-[10px] font-bold uppercase mb-1 opacity-70">Doctor</div>}
                                {msg.sender === 'careCoordinator' && <div className="text-[10px] font-bold uppercase mb-1 opacity-70">Care Manager</div>}
                                {msg.text}
                                {msg.attachment && (
                                    <ChatAttachment
                                        attachment={msg.attachment}
                                        isMine={msg.sender === 'patient'}
                                    />
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${senderStyles[actionLead === 'careTeam' ? 'careCoordinator' : 'bot']}`}>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <footer className="p-3 border-t bg-white rounded-b-2xl">
                    {attachment && (
                        <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden text-xs">
                                <span className="font-bold truncate max-w-[150px]">{attachment.name}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAttachment(null)}
                                className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                    )}
                    {/* Manual Mode Toggles */}
                    <div className="flex justify-center gap-2 mb-3">
                        <button
                            onClick={() => handleSwitchLead('bot')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${actionLead === 'bot' ? 'bg-brand-purple text-white border-brand-purple shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <span>🤖</span> Vita AI
                        </button>
                        <button
                            onClick={() => handleSwitchLead('careTeam')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${actionLead === 'careTeam' ? 'bg-gradient-to-r from-brand-cyan to-brand-text text-white border-transparent shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <span>👥</span> Care Team
                        </button>
                    </div>

                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <FileUploadButton
                            onUploadComplete={(att) => setAttachment(att)}
                            onUploadError={(err) => alert(err)}
                        />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isListening ? "Listening..." : (actionLead === 'careTeam' ? "Message your care team..." : "Type your message...")}
                            className="w-full px-4 py-2 bg-gray-100 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                            aria-label="Chat input"
                            disabled={isLoading}
                        />
                        {isSpeechSupported && (
                            <button
                                type="button"
                                onClick={handleToggleListening}
                                className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-brand-text'}`}
                                aria-label={isListening ? "Stop listening" : "Start voice input"}
                            >
                                <MicrophoneIcon />
                            </button>
                        )}
                        <button type="submit" className="p-2 bg-brand-purple text-white rounded-lg disabled:opacity-50" disabled={(!inputValue.trim() && !attachment) || isLoading} aria-label="Send message">
                            <SendIcon />
                        </button>
                    </form>
                </footer>
            </div>
        </>
    );
};

export default ChatWidget;
