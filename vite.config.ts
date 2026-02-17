
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }
  },
  preview: {
    host: '0.0.0.0',
    // Cloud Run injects the PORT environment variable, usually 8080.
    // We fallback to 8080 if not set.
    port: Number(process.env.PORT) || 8080,
    allowedHosts: true, // Allow the random Cloud Run domains
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'socket-vendor': ['socket.io-client'],
          
          // Large component chunks
          'dashboard-patient': ['./screens/UserDashboard'],
          'dashboard-doctor': ['./screens/DoctorDashboard'],
          'dashboard-caregiver': ['./screens/CaregiverDashboard'],
          'dashboard-admin': ['./screens/AdminDashboard'],
          'landing': ['./screens/LandingPage'],
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    }
  }
});
