


import React, { useState, useEffect } from 'react';
import { mockMessageThreads, MessageThread } from '../../constants';

interface DoctorMessagesScreenProps {
    initialSelectedThreadId?: string | null;
}

const DoctorMessagesScreen: React.FC<DoctorMessagesScreenProps> = ({ initialSelectedThreadId }) => {
    const [threads] = useState<MessageThread[]>(mockMessageThreads);
    const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
    const [isMobileThreadVisible, setIsMobileThreadVisible] = useState(false);

    useEffect(() => {
        const threadToSelect = initialSelectedThreadId 
            ? threads.find(t => t.id === initialSelectedThreadId) 
            : threads.length > 0 ? threads[0] : null;
        
        setSelectedThread(threadToSelect || null);
        
        if (threadToSelect && window.innerWidth < 768) {
             setIsMobileThreadVisible(true);
        }

    }, [initialSelectedThreadId, threads]);

    const handleSelectThread = (thread: MessageThread) => {
        setSelectedThread(thread);
        if (window.innerWidth < 768) {
            setIsMobileThreadVisible(true);
        }
    };


    const leadText: Record<MessageThread['lead'], string> = {
        bot: 'evolv assist',
        // FIX: Replaced 'caregiver' with 'careCoordinator' to match the MessageThread['lead'] type and used a more descriptive value.
        careCoordinator: 'Care Coordinator',
        doctor: 'Doctor (You)'
    };
    
    const senderStyles: Record<any, string> = {
        patient: 'bg-gray-200 text-brand-text rounded-bl-lg self-start',
        bot: 'bg-gray-200 text-brand-text rounded-bl-lg self-start italic',
        // FIX: Replaced 'caregiver' with 'careCoordinator' to match the Message['sender'] type.
        careCoordinator: 'bg-brand-cyan/20 text-brand-text rounded-bl-lg self-start',
        doctor: 'bg-brand-purple text-white rounded-br-lg self-end',
        system: 'bg-gray-100 border text-brand-text-light text-center w-full text-xs self-center',
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
                        <input type="text" placeholder="Search messages..." className="w-full px-3 py-2 text-sm bg-gray-100 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                    </div>
                    <ul className="overflow-y-auto">
                        {threads.map(thread => (
                            <li key={thread.id}>
                                <button
                                    onClick={() => handleSelectThread(thread)}
                                    className={`w-full text-left p-4 hover:bg-gray-50 ${selectedThread?.id === thread.id ? 'bg-brand-purple/5' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={thread.patientImageUrl} alt={thread.patientName} className="w-10 h-10 rounded-full object-cover" />
                                                {thread.unread && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm text-gray-900">{thread.patientName}</h3>
                                                <p className="text-xs text-gray-600 truncate max-w-[150px]">{thread.lastMessage}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400">{thread.timestamp}</span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>
                
                {/* Message View */}
                <main className={`w-full md:w-2/3 flex-col ${isMobileThreadVisible ? 'flex' : 'hidden md:flex'}`}>
                    {selectedThread ? (
                        <>
                            <header className="p-3 border-b border-gray-200 flex items-center gap-3">
                                <button onClick={() => setIsMobileThreadVisible(false)} className="md:hidden p-2 rounded-full hover:bg-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                </button>
                                <img src={selectedThread.patientImageUrl} alt={selectedThread.patientName} className="w-10 h-10 rounded-full object-cover"/>
                                <div className="flex-1">
                                    <h2 className="font-bold text-gray-900">{selectedThread.patientName}</h2>
                                    <p className="text-xs text-gray-500">
                                        Next Action By: <span className={`font-bold ${selectedThread.lead === 'doctor' ? 'text-red-600 animate-pulse' : 'text-brand-purple'}`}>{leadText[selectedThread.lead]}</span>
                                    </p>
                                </div>
                            </header>
                            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                                <div className="flex flex-col gap-3">
                                    {selectedThread.messages.map((msg, index) => (
                                        <div key={index} className={`max-w-[80%] p-3 rounded-2xl text-sm ${senderStyles[msg.sender]}`}>
                                            {msg.text}
                                            <p className={`text-xs mt-1 text-right ${msg.sender === 'doctor' ? 'text-purple-200' : 'text-gray-500'}`}>{msg.timestamp}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <footer className="p-4 border-t bg-white">
                                <div className="flex items-center gap-2">
                                    <input type="text" placeholder="Type a message..." className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                                    <button className="px-4 py-2 text-sm font-semibold text-white bg-brand-purple rounded-lg hover:opacity-90">Send</button>
                                </div>
                            </footer>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Select a conversation to view messages.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DoctorMessagesScreen;