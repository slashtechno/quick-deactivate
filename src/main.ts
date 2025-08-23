import { app } from "./slack.ts";
// Import deactivate.ts to ensure commands are registered
import "./deactivate.ts";




(async () => {
  // Start your app
  await app.start(Deno.env.get("PORT") || 3000);

  app.logger.info("⚡️ Bolt app is running, or at least we can hope it is");
  app.logger.info("If you're seeing this, you're probably in the right place");
})();
