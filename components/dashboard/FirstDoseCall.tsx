import React, { useEffect, useRef, useState } from 'react';

interface FirstDoseCallProps {
    onCallEnd: () => void;
    doctorName: string;
}

const FirstDoseCall: React.FC<FirstDoseCallProps> = ({ onCallEnd, doctorName }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                setError("Could not access the camera. Please check your browser permissions.");
            }
        };

        startCamera();

        // Cleanup function to stop the camera stream when the component unmounts
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tighter text-brand-text">Doctor Consultation</h2>
            <p className="mt-2 text-brand-text-light max-w-2xl mx-auto">Connecting you with your vita-affiliated physician.</p>

            <div className="mt-6 aspect-video bg-gray-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
                {/* Doctor Video Placeholder */}
                <img 
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop" 
                    alt="Doctor on video call"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-lg">{doctorName}</div>

                {/* User's Camera View */}
                <div className="absolute bottom-4 right-4 w-1/4 aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden border-2 border-white/50 shadow-lg">
                    {error ? (
                        <div className="w-full h-full flex items-center justify-center text-center text-xs text-white p-2">
                            {error}
                        </div>
                    ) : (
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-center items-center gap-4">
                 <button className="w-14 h-14 bg-gray-600/80 rounded-full flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                 </button>
                 <button 
                    onClick={onCallEnd}
                    className="px-6 h-14 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2 2m-2-2v5l-5 5H3a2 2 0 01-2-2V8a2 2 0 012-2h3l2-4h4l2 4h3a2 2 0 012 2z" />
                    </svg>
                    End Call
                 </button>
                 <button className="w-14 h-14 bg-gray-600/80 rounded-full flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                 </button>
            </div>
        </div>
    );
};

export default FirstDoseCall;