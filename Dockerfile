# Build stage
FROM oven/bun:latest AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install

# Production stage
FROM oven/bun:latest
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["bun", "src/main.ts"]
