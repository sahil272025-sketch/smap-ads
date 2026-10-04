# Production Dockerfile for SMAP (Sahil Marketing Ads Powerful)
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json .npmrc* ./
RUN npm install

# Copy source files
COPY . .

# Build Vite frontend
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node modules and built assets
COPY package*.json .npmrc* ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create persistent data and uploads directory
RUN mkdir -p data/uploads

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
