import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, type User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

class AuthService {
  async signInWithGoogle(): Promise<User> {
    if (Capacitor.isNativePlatform()) {
      return this.nativeGoogleSignIn();
    }
    return this.webGoogleSignIn();
  }

  private async nativeGoogleSignIn(): Promise<User> {
    const result = await FirebaseAuthentication.signInWithGoogle();

    const idToken = result.credential?.idToken;
    if (!idToken) {
      throw new Error('No ID token returned from native Google Sign-In');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  }

  private async webGoogleSignIn(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }
}

export const authService = new AuthService();

