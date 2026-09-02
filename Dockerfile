# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 4001

ENV NODE_ENV=production
ENV PORT=4001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--loader=tsx", "server/index.ts"]
