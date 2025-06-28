import pkg from "npm:@slack/bolt";
const { App } = pkg;
import { WebClient } from "npm:@slack/web-api";

// Initializes your app with your bot token and app token
const app = new App({
  token: Deno.env.get("SLACK_BOT_TOKEN"),
  socketMode: true,
  appToken: Deno.env.get("SLACK_APP_TOKEN"),
});
const adminToken = Deno.env.get("SLACK_ADMIN_TOKEN") || "";
const adminCookie = `d=${Deno.env.get("SLACK_ADMIN_COOKIE")}`;

// Listens to incoming messages that contain "hello"
app.message("hello", async ({ message, say }) => {
});

app.event("reaction_added", async ({ body, client }) => {
  console.debug(body);
  const channelId = body.event.item.channel;
  console.log(
    "Got reaction",
    body.event.reaction,
    "in",
    body.event.item.channel,
    "original message",
    body.event.item.ts,
  );

  const result = await client.conversations.history({
    channel: channelId,
    latest: body.event.item.ts,
    inclusive: true,
    limit: 1,
  });
  const message = result.messages && result.messages.length > 0
    ? result.messages[0]
    : undefined;
  if (message == undefined) {
    console.error("couldn't get message");
    return;
  }
  console.debug(message);

  const matches = message.text?.match(/U[A-Z0-9]+/g);
  if (matches?.length == 1) {
    const userId = matches[0];
    console.log(`Deactivating ${userId}`);

    try {
      const formData = new FormData();
      formData.append("token", adminToken);
      formData.append("user", userId);
      formData.append("target_team", "T0266FRGM");
      const headers = new Headers();

      // Add the cookie to the headers
      headers.append("Cookie", adminCookie);
      headers.append(
        "Authorization",
        `Bearer ${adminToken}`,
      );
      const resp = await fetch(
        "https://slack.com/api/users.admin.setInactive",
        {
          method: "POST",
          body: formData,
          headers,
        },
      );

      console.log(
        await resp.json(),
      );
    } catch (err) {
      console.error(err);
      return;
    }
  } else {
    console.error("Unable to get 1 user ID");
    return;
  }
});

(async () => {
  // Start your app
  await app.start(Deno.env.get("PORT") || 3000);

  app.logger.info("⚡️ Bolt app is running!");
})();
