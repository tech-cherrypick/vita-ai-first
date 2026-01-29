
import React, { useState, useEffect } from 'react';
import { Patient, TimelineEvent } from '../../constants';
import ConsultationTimeline from '../../components/doctor/ConsultationTimeline';

const ScreenHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold tracking-tighter text-brand-text">{title}</h2>
        <p className="mt-2 text-lg text-brand-text-light max-w-2xl mx-auto">{subtitle}</p>
    </div>
);

const ProfileSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-bold text-brand-text mb-4 pb-3 border-b border-gray-200">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string; isEditing?: boolean; onChange?: (val: string) => void }> = ({ label, value, isEditing, onChange }) => (
    <div>
        <p className="text-sm font-semibold text-brand-text-light mb-1">{label}</p>
        {isEditing && onChange ? (
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none transition-all"
            />
        ) : (
            <p className="text-brand-text font-medium">{value}</p>
        )}
    </div>
);

interface MyProfileScreenProps {
    patient: Patient;
    onUpdatePatient: (patientId: number, newEvent: Omit<TimelineEvent, 'id' | 'date'> | null, updates?: Partial<Patient>) => void;
}

const MyProfileScreen: React.FC<MyProfileScreenProps> = ({ patient, onUpdatePatient }) => {
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [name, setName] = useState(patient.name);
    const [email, setEmail] = useState(patient.email);
    const [phone, setPhone] = useState(patient.phone);
    const [addressLine1, setAddressLine1] = useState(patient.shippingAddress.line1);
    const [city, setCity] = useState(patient.shippingAddress.city);
    const [state, setState] = useState(patient.shippingAddress.state);
    const [zip, setZip] = useState(patient.shippingAddress.zip);
    const [dob, setDob] = useState(patient.dob || '');
    const [country, setCountry] = useState(patient.shippingAddress.country);

    // Sync state if patient prop updates from outside
    useEffect(() => {
        if (!isEditing) {
            setName(patient.name);
            setEmail(patient.email);
            setPhone(patient.phone);
            setAddressLine1(patient.shippingAddress.line1);
            setCity(patient.shippingAddress.city);
            setState(patient.shippingAddress.state);
            setZip(patient.shippingAddress.zip);
            setDob(patient.dob || '');
            setCountry(patient.shippingAddress.country);
        }
    }, [patient, isEditing]);

    const handleSave = () => {
        const updatedPatient: Partial<Patient> = {
            name,
            email,
            phone,
            dob,
            shippingAddress: {
                line1: addressLine1,
                city,
                state,
                zip,
                country
            }
        };

        // Pass null for event as we don't necessarily want a timeline entry for every profile edit
        onUpdatePatient(patient.id, null, updatedPatient);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        // State will reset via useEffect
    };

    return (
        <div>
            <ScreenHeader title="My Profile" subtitle="Manage your personal and contact information." />

            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                <ProfileSection title="Personal Information">
                    <InfoRow
                        label="Full Name"
                        value={name}
                        isEditing={isEditing}
                        onChange={setName}
                    />
                    <InfoRow
                        label="Date of Birth"
                        value={dob}
                        isEditing={isEditing}
                        onChange={setDob}
                    />
                </ProfileSection>

                <ProfileSection title="Contact Details">
                    <InfoRow
                        label="Email Address"
                        value={email}
                        isEditing={isEditing}
                        onChange={setEmail}
                    />
                    <InfoRow
                        label="Phone Number"
                        value={phone}
                        isEditing={isEditing}
                        onChange={setPhone}
                    />
                </ProfileSection>

                <ProfileSection title="Shipping Address">
                    <InfoRow
                        label="Address Line"
                        value={addressLine1}
                        isEditing={isEditing}
                        onChange={setAddressLine1}
                    />

                    {isEditing ? (
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="City" value={city} isEditing={true} onChange={setCity} />
                            <InfoRow label="State" value={state} isEditing={true} onChange={setState} />
                            <InfoRow label="Zip Code" value={zip} isEditing={true} onChange={setZip} />
                            <InfoRow label="Country" value={country} isEditing={true} onChange={setCountry} />
                        </div>
                    ) : (
                        <>
                            <InfoRow label="City, State, Zip" value={`${city}, ${state} ${zip}`} />
                            <InfoRow label="Country" value={country} />
                        </>
                    )}
                </ProfileSection>

                <div className="flex justify-end gap-3 pt-4">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-6 py-3 text-base font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-3 text-base font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-purple/90 transition-colors shadow-lg shadow-brand-purple/20"
                            >
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-6 py-3 text-base font-bold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition-colors"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* Journey History Section */}
                <div className="pt-10 border-t border-gray-100">
                    <ConsultationTimeline timeline={patient.timeline} title="My Journey History" />
                </div>
            </div>
        </div>
    );
};

export default MyProfileScreen;
