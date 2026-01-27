
import React from 'react';
import { Patient } from '../../constants';

interface CareCoordinatorPatientProfileProps {
    patient: Patient;
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-gray-800">{value}</p>
    </div>
);


const CareCoordinatorPatientProfile: React.FC<CareCoordinatorPatientProfileProps> = ({ patient }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-3">Patient Profile</h2>
            
            <div className="space-y-4">
                <h3 className="text-md font-bold text-gray-800">Contact Information</h3>
                <InfoRow label="Full Name" value={patient.name} />
                <InfoRow label="Email Address" value={patient.email} />
                <InfoRow label="Phone Number" value={patient.phone} />
            </div>

            <div className="mt-6 pt-4 border-t space-y-4">
                <h3 className="text-md font-bold text-gray-800">Shipping Address</h3>
                <InfoRow label="Address Line" value={patient.shippingAddress.line1} />
                <InfoRow label="City, State, Zip" value={`${patient.shippingAddress.city}, ${patient.shippingAddress.state} ${patient.shippingAddress.zip}`} />
                <InfoRow label="Country" value={patient.shippingAddress.country} />
            </div>
        </div>
    );
};

export default CareCoordinatorPatientProfile;
