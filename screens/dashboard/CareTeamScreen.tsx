import React from 'react';
import { Patient } from '../../constants';

const ScreenHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold tracking-tighter text-brand-text">{title}</h2>
        <p className="mt-2 text-lg text-brand-text-light max-w-2xl mx-auto">{subtitle}</p>
    </div>
);

interface CareTeamScreenProps {
    patient: Patient;
    onSendMessage?: () => void;
}

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const CareTeamScreen: React.FC<CareTeamScreenProps> = ({ patient, onSendMessage }) => {

    const teamMembers = [
        {
            role: 'Your Physician',
            name: patient.careTeam.physician,
            specialty: 'Endocrinology & Metabolism',
            imageUrl: patient.careTeam.physicianPhotoURL || DEFAULT_AVATAR,
            bio: `Your physician oversees your treatment plan, reviews your lab results, and makes adjustments to your protocol as needed.`
        },
        {
            role: 'Your Care Coordinator',
            name: patient.careTeam.coordinator,
            specialty: 'Patient Support Specialist',
            imageUrl: patient.careTeam.coordinatorPhotoURL || DEFAULT_AVATAR,
            bio: `Your Care Manager is your go-to for any non-medical questions, including shipping, billing, or scheduling. They are here to ensure you have a smooth and positive experience with Vita.`
        }
    ];

    return (
        <div>
            <ScreenHeader title="My Care Team" subtitle="The experts dedicated to your success." />

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {teamMembers.map((member) => (
                    <div key={member.name} className="bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col">
                        <img src={member.imageUrl} alt={member.name} className="w-full h-64 object-cover object-center rounded-t-2xl" />
                        <div className="p-6 flex flex-col flex-1">
                            <p className="font-semibold text-brand-purple">{member.role}</p>
                            <h3 className="text-2xl font-bold text-brand-text mt-1">{member.name}</h3>
                            <p className="text-sm text-brand-text-light mt-1">{member.specialty}</p>
                            <p className="text-brand-text-light mt-4 flex-1">{member.bio}</p>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={onSendMessage}
                                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-brand-purple rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Enter Live Lounge
                                </button>
                                <button className="flex-1 px-4 py-3 text-sm font-bold text-brand-purple bg-brand-purple/10 rounded-lg hover:bg-brand-purple/20 transition-colors">
                                    Schedule a Call
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CareTeamScreen;