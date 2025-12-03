# Deno to Bun Migration

This project has been successfully migrated from Deno to Bun.

## Changes Made

### 1. Package Management
- **Created** `package.json` with Slack dependencies (@slack/bolt, @slack/web-api)
- **Created** `bunfig.toml` for Bun configuration
- Removed dependency on `deno.json` and `deno.lock`

### 2. Source Code Updates
- Replaced all `Deno.env.get()` calls with `process.env.*`
- Updated imports to use standard npm package paths instead of `npm:` scheme
  - `import pkg from "npm:@slack/bolt"` → `import { App } from "@slack/bolt"`
  - `from "npm:@slack/web-api"` → `from "@slack/web-api"`
- Added `.env` file loading with Bun's `loadEnv()` function

### 3. Docker Updates
- Updated base image from `denoland/deno:latest` to `oven/bun:latest`
- Simplified Dockerfile to use Bun's package management
- Updated CMD from `deno run` to `bun src/main.ts`

### 4. Development Configuration
- **Updated** `.vscode/launch.json` to use Bun runtime instead of Deno
- **Updated** `package.json` scripts for Bun commands
  - `bun --watch src/main.ts` for development
  - `bun src/main.ts` for production
- **Updated** `.dockerignore` to ignore Bun cache (`.bun/`) instead of Deno cache
- **Updated** `.gitignore` to ignore Bun cache and lock file patterns

### 5. Documentation
- Updated README.md with Bun installation and running instructions

## Running the Application

### Development
```bash
bun install
bun run dev
```

### Production
```bash
bun install
bun src/main.ts
```

### Docker
```bash
docker compose up --build
```

## Files Changed
- `src/main.ts` - Environment loading and Deno.env → process.env
- `src/slack.ts` - Import statements and environment access
- `src/deactivate.ts` - Environment access
- `src/consts.ts` - Environment access
- `Dockerfile` - Base image and commands
- `.vscode/launch.json` - Debugger configuration
- `.dockerignore` - Cache directory
- `.gitignore` - Bun-specific entries
- `README.md` - Instructions
- `package.json` - NEW
- `bunfig.toml` - NEW
- `MIGRATION.md` - NEW (this file)

## Notes
- Bun is fully compatible with Node.js APIs and npm packages
- All Slack Bolt functionality remains unchanged
- The application uses socket mode for Slack communication and requires proper environment variables
