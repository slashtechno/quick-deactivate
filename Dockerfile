# Build stage
FROM denoland/deno:latest AS builder
WORKDIR /app
COPY . .
RUN deno cache src/main.ts

# Production stage
FROM denoland/deno:latest
WORKDIR /app
COPY --from=builder /app .
CMD ["deno", "run", "--allow-all", "src/main.ts"]
