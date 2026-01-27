
import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { Patient } from '../../constants';

interface DoctorChatAssistantProps {
    patient: Patient;
}

const AssistantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

const DoctorChatAssistant: React.FC<DoctorChatAssistantProps> = ({ patient }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([
        { sender: 'ai', text: `Ready to assist with ${patient.name}'s case. Ask me about vitals, history, or protocol recommendations.` }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInputValue('');
        setIsLoading(true);

        // MOCK AI LOGIC
        setTimeout(() => {
            const lowerMsg = userMsg.toLowerCase();
            let responseText = "I am a simulated assistant. I can help analyze the patient chart.";

            if (lowerMsg.includes('history') || lowerMsg.includes('background')) {
                responseText = `**Patient History Summary:**\n- **Age:** ${patient.age}\n- **Goal:** ${patient.goal}\n- **Current Status:** ${patient.status}\n\nPatient has a history relevant to metabolic health. See the scorecard for details.`;
            } else if (lowerMsg.includes('vital') || lowerMsg.includes('weight') || lowerMsg.includes('bmi')) {
                const bmi = patient.vitals.find(v => v.label === 'BMI')?.value || 'N/A';
                const weight = patient.vitals.find(v => v.label === 'Weight')?.value || 'N/A';
                responseText = `**Vitals Analysis:**\n- **Weight:** ${weight} lbs\n- **BMI:** ${bmi}\n\nTrends indicate ${patient.vitals[0].trend === 'down' ? 'positive response to treatment' : 'stabilization'}.`;
            } else if (lowerMsg.includes('risk') || lowerMsg.includes('contraindication')) {
                responseText = `**Risk Assessment:**\n- No absolute contraindications found.\n- Monitor for GI side effects given current dosage.\n- Psych screenings indicate ${patient.id === 1 ? 'low' : 'moderate'} risk factors.`;
            } else if (lowerMsg.includes('plan') || lowerMsg.includes('dosage') || lowerMsg.includes('rx')) {
                responseText = `**Current Protocol:**\n- **Medication:** ${patient.currentPrescription.name}\n- **Dosage:** ${patient.currentPrescription.dosage}\n\nConsider titration if side effects are manageable after 4 weeks.`;
            }

            setMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-gray-800 rotate-90 opacity-0 pointer-events-none' : 'bg-gray-900 text-white'}`}
                title="Open Doctor Assistant"
            >
                <AssistantIcon />
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-6 right-6 z-50 w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <AssistantIcon />
                        <div>
                            <h3 className="font-bold text-sm">Vita Doctor Assist</h3>
                            <p className="text-xs text-gray-400">Clinical Decision Support (Demo)</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-gray-800 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                                {msg.sender === 'ai' ? (
                                    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} /> 
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 border-t border-gray-200 bg-white rounded-b-2xl">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask about patient history..."
                            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-gray-800 focus:bg-white transition-all text-sm font-medium outline-none"
                        />
                        <button 
                            type="submit" 
                            disabled={!inputValue.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <SendIcon />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default DoctorChatAssistant;
