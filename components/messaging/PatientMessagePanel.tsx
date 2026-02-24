
import React, { useState, useRef, useEffect } from 'react';
import { GlobalChatMessage, ChatAttachment as ChatAttachmentType } from '../../constants';
import FileUploadButton from './FileUploadButton';
import ChatAttachment from './ChatAttachment';

interface PatientMessagePanelProps {
    patientId: string | number;
    chatHistory: GlobalChatMessage[];
    onSendMessage: (msg: Omit<GlobalChatMessage, 'id' | 'timestamp'>) => void;
    userName: string;
    userRole: 'doctor' | 'careCoordinator';
    patientName: string;
    patientImageUrl: string;
}

const PatientMessagePanel: React.FC<PatientMessagePanelProps> = ({
    patientId,
    chatHistory,
    onSendMessage,
    userName,
    userRole,
    patientName,
    patientImageUrl
}) => {
    const [inputValue, setInputValue] = useState('');
    const [attachment, setAttachment] = useState<ChatAttachmentType | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Helper to format date separators
    const getDateSeparator = (isoString?: string) => {
        if (!isoString) return null;
        const msgDate = new Date(isoString);
        if (isNaN(msgDate.getTime())) return null;

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (msgDate.toDateString() === today.toDateString()) return 'Today';
        if (msgDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDisplayTime = (msg: GlobalChatMessage) => {
        if (msg.createdAt) {
            const date = new Date(msg.createdAt);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            }
        }
        // Fallback for legacy messages with just time string
        return msg.timestamp || '';
    };

    const patientMessages = chatHistory
        .filter(m => String(m.patientId) === String(patientId))
        .sort((a, b) => {
            const getValidTime = (dateStr?: string) => {
                if (!dateStr) return 0;
                const d = new Date(dateStr).getTime();
                return isNaN(d) ? 0 : d;
            };

            const timeA = getValidTime(a.createdAt) || getValidTime(a.timestamp);
            const timeB = getValidTime(b.createdAt) || getValidTime(b.timestamp);

            return timeA - timeB;
        });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [patientMessages.length]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() && !attachment) return;

        const messageData: Omit<GlobalChatMessage, 'id' | 'timestamp'> = {
            patientId,
            sender: userRole === 'doctor' ? 'doctor' : 'careCoordinator',
            senderName: userName,
            role: userRole === 'doctor' ? 'Physician' : 'Care Coordinator',
            text: inputValue,
            avatar: userRole === 'doctor'
                ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop'
                : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop',
            createdAt: new Date().toISOString(),
            attachment: attachment || undefined
        };

        onSendMessage(messageData);
        setInputValue('');
        setAttachment(null);
    };

    const senderStyles: Record<string, string> = {
        patient: 'bg-gray-100 text-gray-800 rounded-bl-none self-start',
        careCoordinator: userRole === 'doctor'
            ? 'bg-cyan-50 text-cyan-900 border border-cyan-100 rounded-bl-none self-start'
            : 'bg-brand-cyan text-white rounded-br-none self-end',
        doctor: userRole === 'careCoordinator'
            ? 'bg-purple-50 text-purple-900 border border-purple-100 rounded-bl-none self-start'
            : 'bg-brand-purple text-white rounded-br-none self-end',
        bot: 'bg-gray-50 text-gray-600 italic border border-gray-200 rounded-bl-none self-start text-xs',
        system: 'bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-center w-full self-center py-2 px-4 rounded-xl max-w-[90%]'
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b bg-gray-50/50 flex items-center gap-3">
                <img src={patientImageUrl} alt={patientName} className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1">
                    <h3 className="font-bold text-sm text-gray-900">Messages</h3>
                    <p className="text-xs text-gray-500">{patientName}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="h-[400px] overflow-y-auto p-4 bg-white flex flex-col gap-3">
                {patientMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    patientMessages.map((msg, idx) => {
                        const showDateSeparator = idx === 0 || (
                            patientMessages[idx - 1]?.createdAt && msg.createdAt &&
                            getDateSeparator(patientMessages[idx - 1].createdAt) !== getDateSeparator(msg.createdAt)
                        );

                        return (
                            <React.Fragment key={msg.id}>
                                {showDateSeparator && msg.createdAt && (
                                    <div className="flex justify-center my-4">
                                        <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full">
                                            {getDateSeparator(msg.createdAt)}
                                        </div>
                                    </div>
                                )}
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${senderStyles[msg.sender] || senderStyles.patient}`}>
                                    {msg.sender !== userRole && msg.sender !== 'patient' && msg.sender !== 'system' && (
                                        <p className="text-[10px] font-bold opacity-70 mb-1 uppercase">{msg.senderName || msg.role}</p>
                                    )}
                                    {msg.text && <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />}
                                    {msg.attachment && (
                                        <ChatAttachment
                                            attachment={msg.attachment}
                                            isMine={msg.sender === (userRole === 'doctor' ? 'doctor' : 'careCoordinator')}
                                        />
                                    )}
                                    <p className="text-[10px] mt-1 text-right opacity-60">
                                        {getDisplayTime(msg)}
                                    </p>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t bg-gray-50">
                {attachment && (
                    <div className="mb-2 p-2 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xs font-bold truncate max-w-[200px]">{attachment.name}</span>
                            <span className="text-[10px] text-gray-400">({attachment.type.split('/')[1].toUpperCase()})</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAttachment(null)}
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <FileUploadButton
                        onUploadComplete={(att) => setAttachment(att)}
                        onUploadError={(err) => alert(err)}
                    />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() && !attachment}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-opacity disabled:opacity-50 ${userRole === 'doctor' ? 'bg-brand-purple hover:opacity-90' : 'bg-brand-cyan hover:opacity-90'
                            }`}
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PatientMessagePanel;
