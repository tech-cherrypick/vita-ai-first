// vite.config.ts
import { defineConfig } from "file:///Users/shubhamverma/Coding/vita-ai-first/node_modules/vite/dist/node/index.js";
import react from "file:///Users/shubhamverma/Coding/vita-ai-first/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Resource-Policy": "cross-origin"
    }
  },
  preview: {
    host: "0.0.0.0",
    port: 8080
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom"],
          "firebase-vendor": ["firebase/app", "firebase/auth", "firebase/firestore"],
          "socket-vendor": ["socket.io-client"],
          // Large component chunks
          "dashboard-patient": ["./screens/UserDashboard"],
          "dashboard-doctor": ["./screens/DoctorDashboard"],
          "dashboard-caregiver": ["./screens/CaregiverDashboard"],
          "dashboard-admin": ["./screens/AdminDashboard"],
          "landing": ["./screens/LandingPage"]
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1e3,
    // Enable minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        // Remove console.logs in production
        drop_debugger: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2h1YmhhbXZlcm1hL0NvZGluZy92aXRhLWFpLWZpcnN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc2h1YmhhbXZlcm1hL0NvZGluZy92aXRhLWFpLWZpcnN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zaHViaGFtdmVybWEvQ29kaW5nL3ZpdGEtYWktZmlyc3Qvdml0ZS5jb25maWcudHNcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHBvcnQ6IDUxNzMsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0Nyb3NzLU9yaWdpbi1PcGVuZXItUG9saWN5JzogJ3NhbWUtb3JpZ2luLWFsbG93LXBvcHVwcycsXG4gICAgICAnQ3Jvc3MtT3JpZ2luLVJlc291cmNlLVBvbGljeSc6ICdjcm9zcy1vcmlnaW4nXG4gICAgfVxuICB9LFxuICBwcmV2aWV3OiB7XG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHBvcnQ6IDgwODAsXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFZlbmRvciBjaHVua3NcbiAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICAnZmlyZWJhc2UtdmVuZG9yJzogWydmaXJlYmFzZS9hcHAnLCAnZmlyZWJhc2UvYXV0aCcsICdmaXJlYmFzZS9maXJlc3RvcmUnXSxcbiAgICAgICAgICAnc29ja2V0LXZlbmRvcic6IFsnc29ja2V0LmlvLWNsaWVudCddLFxuXG4gICAgICAgICAgLy8gTGFyZ2UgY29tcG9uZW50IGNodW5rc1xuICAgICAgICAgICdkYXNoYm9hcmQtcGF0aWVudCc6IFsnLi9zY3JlZW5zL1VzZXJEYXNoYm9hcmQnXSxcbiAgICAgICAgICAnZGFzaGJvYXJkLWRvY3Rvcic6IFsnLi9zY3JlZW5zL0RvY3RvckRhc2hib2FyZCddLFxuICAgICAgICAgICdkYXNoYm9hcmQtY2FyZWdpdmVyJzogWycuL3NjcmVlbnMvQ2FyZWdpdmVyRGFzaGJvYXJkJ10sXG4gICAgICAgICAgJ2Rhc2hib2FyZC1hZG1pbic6IFsnLi9zY3JlZW5zL0FkbWluRGFzaGJvYXJkJ10sXG4gICAgICAgICAgJ2xhbmRpbmcnOiBbJy4vc2NyZWVucy9MYW5kaW5nUGFnZSddLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICAvLyBJbmNyZWFzZSBjaHVuayBzaXplIHdhcm5pbmcgbGltaXRcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgLy8gRW5hYmxlIG1pbmlmaWNhdGlvblxuICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLCAvLyBSZW1vdmUgY29uc29sZS5sb2dzIGluIHByb2R1Y3Rpb25cbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsTUFDUCw4QkFBOEI7QUFBQSxNQUM5QixnQ0FBZ0M7QUFBQSxJQUNsQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLFNBQVMsV0FBVztBQUFBLFVBQ3JDLG1CQUFtQixDQUFDLGdCQUFnQixpQkFBaUIsb0JBQW9CO0FBQUEsVUFDekUsaUJBQWlCLENBQUMsa0JBQWtCO0FBQUE7QUFBQSxVQUdwQyxxQkFBcUIsQ0FBQyx5QkFBeUI7QUFBQSxVQUMvQyxvQkFBb0IsQ0FBQywyQkFBMkI7QUFBQSxVQUNoRCx1QkFBdUIsQ0FBQyw4QkFBOEI7QUFBQSxVQUN0RCxtQkFBbUIsQ0FBQywwQkFBMEI7QUFBQSxVQUM5QyxXQUFXLENBQUMsdUJBQXVCO0FBQUEsUUFDckM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSx1QkFBdUI7QUFBQTtBQUFBLElBRXZCLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQTtBQUFBLFFBQ2QsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
