FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# Install build tools for better-sqlite3 native bindings
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm rebuild better-sqlite3

COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle

# SQLite data directory (mount a Railway volume here)
RUN mkdir -p /data

ENV DB_PATH=/data/maopos.db
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "build"]
