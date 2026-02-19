
import React, { useState } from 'react';

// Declare global Cashfree variable
declare global {
    interface Window {
        Cashfree: any;
    }
}

interface PaymentComponentProps {
    onPaymentSuccess: (orderId: string) => void;
    patientDetails: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    amount?: number;
}

const GradientButton: React.FC<{ children: React.ReactNode, onClick?: () => void, type?: "button" | "submit", className?: string, disabled?: boolean }> = ({ children, onClick, type = "button", className = "", disabled = false }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan bg-[length:200%_auto] rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-purple/20 animate-gradient-x ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {children}
    </button>
);

const PaymentComponent: React.FC<PaymentComponentProps> = ({ onPaymentSuccess, patientDetails, amount = 3999 }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // Check if Cashfree SDK is loaded
            if (!window.Cashfree) {
                console.error("Cashfree SDK not loaded");
                alert("Payment system not ready. Please refresh the page.");
                setIsProcessing(false);
                return;
            }

            const cashfree = new window.Cashfree({
                mode: import.meta.env.VITE_CASHFREE_MODE || "sandbox"
            });

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const res = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderAmount: amount, // Amount in INR
                    customerId: patientDetails.id || 'guest_user',
                    customerPhone: patientDetails.phone || '9999999999',
                    customerName: patientDetails.name || 'Guest',
                    customerEmail: patientDetails.email || 'guest@example.com'
                })
            });

            const data = await res.json();

            if (data.payment_session_id) {
                const checkoutOptions = {
                    paymentSessionId: data.payment_session_id,
                    redirectTarget: "_modal",
                };

                cashfree.checkout(checkoutOptions).then((result: any) => {
                    if (result.error) {
                        console.log("User cancelled payment or error occured", result.error);
                        setIsProcessing(false);
                    }
                    if (result.redirect) {
                        console.log("Payment redirection");
                        setIsProcessing(false);
                    }
                    if (result.paymentDetails) {
                        console.log("Payment completed", result.paymentDetails);
                        onPaymentSuccess(data.order_id);
                    }
                });

            } else {
                console.error("Failed to create payment session", data);
                setIsProcessing(false);
                alert("Failed to initiate payment. Please try again.");
            }

        } catch (error) {
            console.error("Payment Error:", error);
            setIsProcessing(false);
            alert("An error occurred. Please try again.");
        }
    }

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center text-center min-h-[300px]">
                <svg className="animate-spin h-10 w-10 text-brand-purple mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="font-semibold text-brand-text">Processing Payment...</p>
                <p className="text-xs text-gray-400 mt-2">Please do not close this window</p>
            </div>
        )
    }

    return (
        <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tighter text-brand-text">Confirm Your Plan</h2>
            <p className="mt-2 text-lg text-brand-text-light max-w-2xl mx-auto">
                You're ready to start. Please confirm your payment for the first month to secure your doctor consultation.
            </p>

            <div className="mt-8 max-w-sm mx-auto bg-gray-50 border border-gray-200 rounded-2xl p-6">
                {amount === 3999 ? (
                    <>
                        <div className="flex justify-between items-center text-brand-text">
                            <span>Metabolic Lab Panel</span>
                            <span>₹2,499</span>
                        </div>
                        <div className="flex justify-between items-center text-brand-text mt-2">
                            <span>Doctor Consultation Fee</span>
                            <span>₹1,500</span>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-between items-center text-brand-text">
                        <span>Test Charges</span>
                        <span>₹{amount}</span>
                    </div>
                )}
                <div className="border-t border-gray-200 my-4"></div>
                <div className="flex justify-between items-center font-bold text-brand-text text-xl">
                    <span>Total</span>
                    <span>₹{amount.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <GradientButton onClick={handlePayment} className="mt-8 max-w-sm mx-auto">
                Pay Securely
            </GradientButton>
            <p className="text-xs text-gray-400 mt-4 flex justify-center items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z" /></svg>
                Secured by Cashfree Payments
            </p>

        </div>
    );
};

export default PaymentComponent;
