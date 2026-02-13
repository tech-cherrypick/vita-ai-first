import { useState } from 'react';
import { VitaLogo } from '../constants';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

interface UnifiedLoginPageProps {
    onSignIn: (user: any) => void;
}

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M 22.56 12.25 c 0 -0.78 -0.07 -1.53 -0.2 -2.25 H 12 v 4.26 h 5.92 c -0.26 1.37 -1.04 2.53 -2.21 3.31 v 2.77 h 3.57 c 2.08 -1.92 3.28 -4.74 3.28 -8.09 z" fill="#4285F4" />
        <path d="M 12 23 c 2.97 0 5.46 -0.98 7.28 -2.66 l -3.57 -2.77 c -0.98 0.66 -2.23 1.06 -3.71 1.06 c -2.86 0 -5.29 -1.93 -6.16 -4.53 H 2.18 v 2.84 C 3.99 20.53 7.7 23 12 23 z" fill="#34A853" />
        <path d="M 5.84 14.09 c -0.22 -0.66 -0.35 -1.36 -0.35 -2.09 s 0.13 -1.43 0.35 -2.09 V 7.07 H 2.18 C 1.43 8.55 1 10.22 1 12 s 0.43 3.45 1.18 4.93 l 2.85 -2.22 0.81 -0.62 z" fill="#FBBC05" />
        <path d="M 12 5.38 c 1.62 0 3.06 0.56 4.21 1.64 l 3.15 -3.15 C 17.45 2.09 14.97 1 12 1 c -4.3 0 -8.01 2.47 -9.82 6.07 l 3.66 2.84 c 0.87 -2.6 3.3 -4.53 6.16 -4.53 z" fill="#EA4335" />
    </svg>
);

const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({ onSignIn }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            onSignIn(result.user);
        } catch (error: any) {
            console.error("Auth Error:", error.code, error.message);

            // Handle cases where the user intentionally closes the popup or cancels the request
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                setIsLoading(false);
                return;
            }

            const errorMessage = `Authentication failed: ${error.message} (${error.code})`;

            if (error.code === 'auth/popup-blocked') {
                alert("The login popup was blocked. Please enable popups for this site.");
            } else if (error.code === 'auth/network-request-failed') {
                alert("Network error. Please check your internet connection.");
            } else if (error.code === 'auth/unauthorized-domain') {
                alert(`${errorMessage}. Please ensure this domain is whitelisted in your Firebase Console (Authentication > Settings > Authorized domains).`);
            } else {
                alert(`${errorMessage}. Please check your Firebase configuration and deployment settings.`);
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg relative overflow-hidden p-4">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-purple/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-cyan/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/50 relative z-10 animate-slide-in-up">
                <div className="text-center mb-8">
                    <div className="mb-6 inline-block scale-110">
                        <VitaLogo />
                    </div>
                    <h2 className="text-2xl font-extrabold text-brand-text tracking-tight">Welcome to Vita</h2>
                    <p className="text-brand-text-light mt-2 text-sm">Sign in with your Google account to continue.</p>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-4 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M 4 12 a 8 8 0 0 1 8 -8 V 0 C 5.373 0 0 5.373 0 12 h 4 z m 2 5.291 A 7.962 7.962 0 0 1 4 12 H 0 c 0 3.042 1.135 5.824 3 7.938 l 3 -2.647 z"></path>
                        </svg>
                    ) : (
                        <>
                            <GoogleIcon />
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>

                <div className="mt-8 text-center text-xs text-gray-400 max-w-xs mx-auto">
                    By continuing, you agree to our <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
                </div>
            </div>
        </div>
    );
};

export default UnifiedLoginPage;
