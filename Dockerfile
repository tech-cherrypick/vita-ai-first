# Stage 1: Build the Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./

# Define Build Arguments
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_API_BASE_URL
ARG VITE_RAZORPAY_KEY_ID

# Map Arguments to Environment Variables for Vite
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the Backend
FROM node:18-alpine
WORKDIR /app/backend

# Copy backend dependency files first (for better caching)
COPY backend/package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the backend source code
COPY backend/ .

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/dist /app/dist

# Ensure we're in the right place
WORKDIR /app/backend

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
