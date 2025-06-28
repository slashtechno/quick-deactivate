import pkg from "npm:@slack/bolt";
const { App } = pkg;

// Initializes your app with your bot token and app token
const app = new App({
  token: Deno.env.get("SLACK_BOT_TOKEN"),
  socketMode: true,
  appToken: Deno.env.get("SLACK_APP_TOKEN"),
});
const adminToken = Deno.env.get("SLACK_ADMIN_TOKEN") || "";
const adminCookie = `d=${Deno.env.get("SLACK_ADMIN_COOKIE")}`;

// Okay, I trust if you're reading this, you're not going to go and delete this regex pattern link that I'm probably never going to reference again and that I don't feel like storing the delete URL to.
// https://regex101.com/r/mY8acm/4
// https://regex101.com/DON'Tdelete/EaVW5aHHujMKRecKvbLLJ2ncV6GW27HxvVcZ
app.message(
  /^(?:hey <\!subteam\^S07TQBKCVL7>!(\r\n|\r|\n))?there's someone that needs to be deactivated:/i,
  async ({ body, client }) => {
    console.debug(body);
    const channelId = body.event.channel;

    const result = await client.conversations.history({
      channel: channelId,
      latest: body.event.ts,
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
    if (matches && matches.length >= 1) {
      const userId = matches[0];
      console.info(`Deactivating ${userId}`);

      try {
        const formData = new FormData();
        formData.append("user", userId);
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
        console.debug(
          await resp.json(),
        );

        // React with :white_check_mark:
        client.reactions.add(
          {
            channel: channelId,
            timestamp: body.event.ts,
            name: "white_check_mark",
          },
        );
      } catch (err) {
        console.error(err);
        return;
      }
    } else {
      console.error("Unable to get 1 user ID");
      return;
    }
  },
);

// Inspect message... but better :)
app.event("reaction_added", async ({ body, client }) => {
  console.debug(body);
    const channelId = body.event.item.channel;
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
});

(async () => {
  // Start your app
  await app.start(Deno.env.get("PORT") || 3000);

  app.logger.info("⚡️ Bolt app is running!");
})();
