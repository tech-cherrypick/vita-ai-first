import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vita.app',
  appName: 'Vita+',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      '*.googleusercontent.com',
      '*.google.com',
      '*.razorpay.com',
      '*.firebaseapp.com',
      '*.googleapis.com',
    ],
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;

