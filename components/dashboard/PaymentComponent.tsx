
import React, { useState } from 'react';

interface PaymentComponentProps {
    onPaymentSuccess: () => void;
}

const GradientButton: React.FC<{ children: React.ReactNode, onClick?: () => void, type?: "button" | "submit", className?: string, disabled?: boolean }> = ({ children, onClick, type="button", className="", disabled=false }) => (
    <button 
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan bg-[length:200%_auto] rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-purple/20 animate-gradient-x ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {children}
    </button>
);


const PaymentComponent: React.FC<PaymentComponentProps> = ({ onPaymentSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            onPaymentSuccess();
        }, 2000);
    }
    
    if (isProcessing) {
        return (
             <div className="flex flex-col items-center justify-center text-center min-h-[300px]">
                <svg className="animate-spin h-10 w-10 text-brand-purple mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="font-semibold text-brand-text">Processing Payment...</p>
            </div>
        )
    }

    return (
        <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tighter text-brand-text">Confirm Your Plan</h2>
            <p className="mt-4 text-lg text-brand-text-light max-w-2xl mx-auto">
                You're ready to start. Please confirm your payment for the first month to secure your doctor consultation.
            </p>

            <div className="mt-8 max-w-sm mx-auto bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="flex justify-between items-center text-brand-text">
                    <span>Month 1 Subscription</span>
                    <span>₹8,999</span>
                </div>
                 <div className="flex justify-between items-center text-brand-text mt-2">
                    <span>Doctor Consultation Fee</span>
                    <span>₹1,000</span>
                </div>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="flex justify-between items-center font-bold text-brand-text text-xl">
                    <span>Total</span>
                    <span>₹9,999</span>
                </div>
            </div>
            
             <GradientButton onClick={handlePayment} className="mt-8 max-w-sm mx-auto">
                Pay Now
            </GradientButton>

        </div>
    );
};

export default PaymentComponent;
