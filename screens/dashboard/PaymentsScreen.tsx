
import React from 'react';

const ScreenHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold tracking-tighter text-brand-text">{title}</h2>
        <p className="mt-2 text-lg text-brand-text-light max-w-2xl mx-auto">{subtitle}</p>
    </div>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode, actionButton?: React.ReactNode }> = ({ title, children, actionButton }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-lg font-bold text-brand-text">{title}</h3>
            {actionButton}
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);


const PaymentsScreen: React.FC = () => {
    const billingHistory = [
        { date: "September 18, 2024", description: "Monthly Subscription", amount: "₹9,999.00" },
        { date: "August 18, 2024", description: "Monthly Subscription", amount: "₹9,999.00" },
        { date: "July 18, 2024", description: "Monthly Subscription", amount: "₹9,999.00" },
        { date: "June 18, 2024", description: "Month 1 + Consultation", amount: "₹9,999.00" },
    ];

    return (
        <div>
            <ScreenHeader title="Payments & Subscriptions" subtitle="Manage your plan, payment method, and view billing history." />
            
            <div className="max-w-3xl mx-auto space-y-8">
                <SectionCard title="Current Plan">
                    <div>
                        <p className="text-sm font-semibold text-brand-text-light">Plan</p>
                        <p className="font-bold text-brand-text text-lg">Monthly GLP-1 Program</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-brand-text-light">Next Billing Date</p>
                        <p className="text-brand-text">October 18, 2024</p>
                    </div>
                     <div>
                        <p className="text-sm font-semibold text-brand-text-light">Amount</p>
                        <p className="text-brand-text">₹9,999.00</p>
                    </div>
                </SectionCard>
                
                 <SectionCard 
                    title="Payment Method"
                    actionButton={<button className="text-sm font-semibold text-brand-purple hover:underline">Edit</button>}
                >
                    <div className="flex items-center gap-4">
                         <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c49733439f1b6352936e63.svg" alt="Visa" className="h-8"/>
                        <div>
                             <p className="font-semibold text-brand-text">Visa ending in 4242</p>
                            <p className="text-sm text-brand-text-light">Expires 12/2026</p>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Billing History">
                    <div className="flow-root">
                        <ul className="-my-4 divide-y divide-gray-200">
                            {billingHistory.map((item, index) => (
                                <li key={index} className="flex items-center justify-between py-4">
                                    <div>
                                        <p className="font-medium text-brand-text">{item.description}</p>
                                        <p className="text-sm text-brand-text-light">{item.date}</p>
                                    </div>
                                    <p className="font-semibold text-brand-text">{item.amount}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
};

export default PaymentsScreen;
