FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm install

# Copy source code and build
COPY frontend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install static server
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-p", "3000"]
