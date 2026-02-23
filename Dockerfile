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
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/dist /app/dist

# Expose the port (Cloud Run defaults to 8080, but our server uses process.env.PORT)
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
