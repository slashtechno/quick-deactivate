import { loadEnv } from "bun";
import { app } from "./slack.ts";
// Import deactivate.ts to ensure commands are registered
import "./deactivate.ts";

// Load environment variables from .env file
await loadEnv({ path: ".env" });

(async () => {
  // Start your app
  await app.start(Number(process.env.PORT) || 3000);

  app.logger.info("⚡️ Bolt app is running, or at least we can hope it is");
  app.logger.info("If you're seeing this, you're probably in the right place");
})();
