
import React, { useState, useEffect } from 'react';
import { GlobalChatMessage, Patient } from '../../constants';

interface DoctorMessagesScreenProps {
    chatHistory: GlobalChatMessage[];
    allPatients: Patient[];
    initialSelectedThreadId?: string | null;
    onSendMessage: (msg: Omit<GlobalChatMessage, 'id' | 'timestamp'>) => void;
}

const DoctorMessagesScreen: React.FC<DoctorMessagesScreenProps> = ({ chatHistory, allPatients, initialSelectedThreadId, onSendMessage }) => {
    const [selectedPatientId, setSelectedPatientId] = useState<string | number | null>(null);
    const [isMobileThreadVisible, setIsMobileThreadVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');

    // Group messages by patient and sort by activity
    const threads = allPatients.map(patient => {
        const messages = chatHistory.filter(m => String(m.patientId) === String(patient.id)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        return {
            patient,
            messages,
            lastMessage,
            lastMessageTime: lastMessage ? new Date(lastMessage.timestamp).getTime() : 0
        };
    }).sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    useEffect(() => {
        if (initialSelectedThreadId) {
            const thread = threads.find(t => t.patient.id.toString() === initialSelectedThreadId || t.patient.id === parseInt(initialSelectedThreadId));
            if (thread) setSelectedPatientId(thread.patient.id);
            if (window.innerWidth < 768) {
                setIsMobileThreadVisible(true);
            }
        } else if (threads.length > 0 && !selectedPatientId) {
            setSelectedPatientId(threads[0].patient.id);
        }
    }, [initialSelectedThreadId, threads.length]);

    const activeThread = threads.find(t => String(t.patient.id) === String(selectedPatientId));

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !selectedPatientId) return;

        onSendMessage({
            patientId: selectedPatientId,
            sender: 'doctor',
            senderName: 'Dr. Sarah Mitchell',
            role: 'Lead Physician',
            text: inputValue,
            avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop'
        });
        setInputValue('');
    };

    const senderStyles: Record<string, string> = {
        patient: 'bg-gray-100 text-gray-800 rounded-bl-none self-start',
        careCoordinator: 'bg-cyan-50 text-cyan-900 border border-cyan-100 rounded-bl-none self-start',
        doctor: 'bg-brand-purple text-white rounded-br-none self-end',
        bot: 'bg-gray-50 text-gray-600 italic border border-gray-200 rounded-bl-none self-start text-xs',
        system: 'bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-center w-full self-center py-2 px-4 rounded-xl max-w-[90%]'
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Messages</h1>
                <p className="mt-1 text-gray-600">Communicate with your patients securely.</p>
            </div>

            <div className="flex flex-col md:flex-row h-[70vh] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Threads List */}
                <aside className={`w-full md:w-1/3 border-r border-gray-200 flex-col ${isMobileThreadVisible ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b">
                        <input type="text" placeholder="Search patients..." className="w-full px-3 py-2 text-sm bg-gray-100 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                    </div>
                    <ul className="overflow-y-auto flex-1">
                        {threads.map(thread => (
                            <li key={thread.patient.id}>
                                <button
                                    onClick={() => { setSelectedPatientId(thread.patient.id); setIsMobileThreadVisible(true); }}
                                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedPatientId === thread.patient.id ? 'bg-brand-purple/5 border-r-4 border-brand-purple' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img src={thread.patient.imageUrl} alt={thread.patient.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-sm text-gray-900 truncate">{thread.patient.name}</h3>
                                                <p className="text-xs text-gray-500 truncate">{thread.lastMessage?.text || 'No messages'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                            {thread.lastMessage ? new Date(thread.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                </button>
                            </li>
                        ))}
                        {threads.length === 0 && <div className="p-4 text-center text-gray-500 text-sm">No active conversations.</div>}
                    </ul>
                </aside>

                {/* Message View */}
                <main className={`w-full md:w-2/3 flex-col ${isMobileThreadVisible ? 'flex' : 'hidden md:flex'}`}>
                    {activeThread ? (
                        <>
                            <header className="p-3 border-b border-gray-200 flex items-center gap-3 bg-gray-50/50">
                                <button onClick={() => setIsMobileThreadVisible(false)} className="md:hidden p-2 rounded-full hover:bg-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                </button>
                                <img src={activeThread.patient.imageUrl} alt={activeThread.patient.name} className="w-10 h-10 rounded-full object-cover" />
                                <div className="flex-1">
                                    <h2 className="font-bold text-gray-900">{activeThread.patient.name}</h2>
                                    <p className="text-xs text-gray-500">Goal: {activeThread.patient.goal}</p>
                                </div>
                            </header>
                            <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col gap-3">
                                {activeThread.messages.map((msg) => (
                                    <div key={msg.id} className={`max-w-[80%] p-3 rounded-2xl text-sm ${senderStyles[msg.sender] || senderStyles.patient}`}>
                                        {msg.sender !== 'doctor' && msg.sender !== 'patient' && msg.sender !== 'system' && <p className="text-[10px] font-bold opacity-70 mb-1 uppercase">{msg.role || msg.senderName}</p>}
                                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                                        <p className={`text-[10px] mt-1 text-right opacity-60`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSend} className="p-4 border-t bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Type a message to the patient..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple shadow-sm"
                                    />
                                    <button type="submit" disabled={!inputValue.trim()} className="px-6 py-3 text-sm font-bold text-white bg-brand-purple rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                                        Send
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
                            <p>Select a patient to start messaging.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DoctorMessagesScreen;