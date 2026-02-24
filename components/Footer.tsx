
import React from 'react';
import { VitaLogo } from '../constants';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-100 mt-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col items-center mb-8">
                     <VitaLogo />
                     <p className="text-sm text-brand-text-light mt-2">&copy; {new Date().getFullYear()} Vita Health Inc. All rights reserved.</p>
                </div>
                
                <div className="max-w-4xl mx-auto space-y-4 text-[10px] text-gray-400 leading-relaxed text-justify border-t border-gray-100 pt-8">
                    <p>
                        <strong>Medical Advice Disclaimer:</strong> The content provided by Vita Health, including text, graphics, images, and other material, is for informational purposes only and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this website.
                    </p>
                    <p>
                        <strong>Medication Risks:</strong> GLP-1 receptor agonists (e.g., Semaglutide, Tirzepatide) are prescription medications. They may cause side effects including nausea, vomiting, diarrhea, stomach pain, and constipation. Rare but serious side effects may include pancreatitis, gallbladder problems, kidney issues, and allergic reactions. These medications are not suitable for everyone. Do not use if you have a personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).
                    </p>
                    <p>
                        <strong>Results Disclaimer:</strong> Weight loss results depicted on this site are illustrative and not guaranteed. Individual results will vary based on factors such as starting weight, medical history, metabolic profile, adherence to the medication schedule, and lifestyle changes including diet and exercise.
                    </p>
                    <p>
                        <strong>Regulatory Compliance:</strong> Vita Health facilitates connections with licensed medical professionals. All prescriptions are issued by board-certified physicians in compliance with Indian Telemedicine Practice Guidelines and CDSCO regulations.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
