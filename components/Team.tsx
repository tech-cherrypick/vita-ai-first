
import React from 'react';
import { teamMembers } from '../constants';

const Team: React.FC = () => {
    return (
        <section className="py-20 sm:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                     <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-brand-text">
                        Meet Your <span className="bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent">Dream Team</span>
                    </h2>
                    <p className="mt-4 text-lg text-brand-text-light max-w-2xl mx-auto">
                        Board-certified doctors who actually get it
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {teamMembers.map((member, index) => (
                        <div key={index} className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 overflow-hidden text-center border border-gray-100">
                            <img src={member.imageUrl} alt={member.name} className="w-full h-80 object-cover object-center" />
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-brand-text">{member.name}</h3>
                                <p className="text-brand-purple font-semibold mt-1">{member.specialty}</p>
                                <p className="text-brand-text-light mt-4 text-sm whitespace-pre-line">{member.bio}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Team;