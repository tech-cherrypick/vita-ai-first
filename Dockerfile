# Stage 1: Build the Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./

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
