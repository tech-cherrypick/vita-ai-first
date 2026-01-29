import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCw17MMJWouLcoxlzHFHfqwjDWHQ5MuSOs",
    authDomain: "vita-479105.firebaseapp.com",
    projectId: "vita-479105",
    storageBucket: "vita-479105.firebasestorage.app",
    messagingSenderId: "15159842002",
    appId: "1:15159842002:web:a6f3872c4eabd22e8ec90b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
