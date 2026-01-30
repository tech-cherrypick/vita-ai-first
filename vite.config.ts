
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
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
  }
});
