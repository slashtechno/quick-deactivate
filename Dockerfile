FROM denoland/deno:latest
WORKDIR /app
COPY . .
CMD ["deno", "run", "--allow-all", "main.ts"]
