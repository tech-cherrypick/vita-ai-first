import React, { useState, useEffect, useRef } from 'react';
import { Patient, GlobalChatMessage } from '../../constants';
import { getSocket } from '../../socket';

interface PatientMessagesScreenProps {
    patient: Patient;
}

const PatientMessagesScreen: React.FC<PatientMessagesScreenProps> = ({ patient }) => {
    const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socket = getSocket();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // 1. Initial Fetch from Firestore (via Backend REST API if needed, but for now we'll assume it's empty or we could fetch)
        // For now, let's just use the Socket for real-time and assuming history might be fetched separately.
        // Actually, it's better to fetch history from the patient object if we store it there, 
        // but the current patient object doesn't have messages yet.
        // Let's assume we fetch history on mount from an API.
        const fetchHistory = async () => {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            try {
                // Since messages are in a subcollection, we might need a specific endpoint 
                // or just rely on the existing syncData structure.
                // However, for group chat, it's cleaner to have a specific fetch.
                // Let's use a generic fetch since we know the path.
                const response = await fetch(`${API_BASE_URL}/api/user/messages`, {
                    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
                }
            } catch (err) {
                console.error('Failed to fetch chat history', err);
            }
        };
        fetchHistory();

        // 2. Join Room
        socket.emit('join_room', patient.id);

        // 3. Listen for Messages
        socket.on('receive_message', (message: GlobalChatMessage) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            socket.off('receive_message');
        };
    }, [patient.id, socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const messageData = {
            patientUid: patient.id,
            text: inputValue,
            senderId: patient.id,
            senderName: patient.name,
            senderRole: 'patient',
            avatar: patient.imageUrl
        };

        socket.emit('send_message', messageData);
        setInputValue('');
    };

    const senderStyles: Record<string, string> = {
        patient: 'bg-brand-purple text-white rounded-br-none self-end',
        careCoordinator: 'bg-cyan-50 text-cyan-900 border border-cyan-100 rounded-bl-none self-start',
        doctor: 'bg-gray-100 text-gray-800 rounded-bl-none self-start',
        bot: 'bg-gray-50 text-gray-600 italic border border-gray-200 rounded-bl-none self-start text-xs',
        system: 'bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-center w-full self-center py-2 px-4 rounded-xl max-w-[90%]'
    };

    return (
        <div className="flex flex-col h-[70vh] bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
            <header className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-xl">
                        💬
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 leading-tight">Care Team Chat</h2>
                        <p className="text-xs text-brand-text-light">Connected with Dr. {patient.careTeam.physician}</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30 flex flex-col gap-4">
                {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-4xl mb-4">
                            👋
                        </div>
                        <h3 className="font-bold text-gray-900">Start a conversation</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-1">Your physician and care coordinator will see your messages here.</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm transition-all animate-slide-in-up ${senderStyles[msg.sender] || senderStyles.patient}`}>
                        {(msg.sender === 'doctor' || msg.sender === 'careCoordinator') && (
                            <p className="text-[10px] font-black opacity-60 mb-1 uppercase tracking-wider">{msg.senderName || (msg.sender === 'doctor' ? 'Doctor' : 'Coordinator')}</p>
                        )}
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className="text-[9px] mt-2 text-right opacity-50 font-medium">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message to your team..."
                        className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-purple shadow-inner transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="w-12 h-12 flex items-center justify-center text-white bg-brand-purple rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-brand-purple/20 disabled:opacity-50 disabled:grayscale"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PatientMessagesScreen;
