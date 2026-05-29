# Stage 1: Build the TypeScript application
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies if needed (e.g. python, make, g++ for some native addons)
RUN apk add --no-cache python3 make g++

# Copy package configuration
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy tsconfig and source files
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Stage 2: Run the compiled application
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Create a logs directory inside the app container
RUN mkdir -p logs && chown -R node:node /app

# Run as non-root user for security
USER node

# Expose backend port
EXPOSE 4001

# Start the application
CMD ["node", "dist/server.js"]
