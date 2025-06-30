import pkg from "npm:@slack/bolt";
import { WebClient, WebClient as WebClientType } from "npm:@slack/web-api";
const { App } = pkg;

// Initializes your app with your bot token and app token
const app = new App({
  token: Deno.env.get("SLACK_BOT_TOKEN"),
  socketMode: true,
  appToken: Deno.env.get("SLACK_APP_TOKEN"),
});
const adminToken = Deno.env.get("SLACK_ADMIN_TOKEN") || "";
const adminCookie = `d=${Deno.env.get("SLACK_ADMIN_COOKIE")}`;

const LOG_CHANNEL = "C07U4A62KL3"; // Channel ID for the log channel

interface deactivateOptions {
  userId: string;
  adminToken: string;
  adminCookie: string;
}

interface DeactivateResponse {
  ok: boolean;
  [key: string]: unknown;
}

async function deactivate(
  options: deactivateOptions,
): Promise<DeactivateResponse> {
  const formData = new FormData();
  formData.append("user", options.userId);
  // formData.append("token", options.adminToken);
  // formData.append("target_team", "T0266FRGM");
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
  const respJson = await resp.json();
  return respJson;
}

interface parseAndDeactivateOptions extends deactivateOptions {
  messageContent: string;
  channelId: string;
  messageTs: string;
  client: WebClientType;
}
async function parseAndDeactivate(options: parseAndDeactivateOptions) {
  const matches = options.messageContent.match(/U[A-Z0-9]+/g);
  let userId = "";
  if (matches && matches.length >= 1) {
    userId = matches[0]; // Matches entire matched string, matches[1] matches the first group
  } else {
    try {
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
      const emailMatch = options.messageContent.match(emailRegex);
      if (!emailMatch) {
        console.error("No email found in message content", options.messageContent);
        return;
      }
      const email = emailMatch[1];
      const userInfo = await options.client.users.lookupByEmail({
        email: email,
      });
      if (userInfo.user && userInfo.user.id) {
        userId = userInfo.user.id;
      } else {
        console.error(
          `No user found for email: ${options.messageContent}, userInfo: ${
            JSON.stringify(userInfo)
          }`,
        );
        return;
      }
    } catch (_err) {
      console.error("Error looking up user by email:", options.messageContent);
      return;
    }
  }


  console.info(`Deactivating ${userId}`);
  try {
    const respJson = await deactivate(
      {
        userId,
        adminCookie: options.adminCookie,
        adminToken: options.adminToken,
      },
    );
    if (!respJson.ok) {
      console.error(`Failed to deactivate user ${userId}:`, respJson);
      if (respJson.error === "user_not_found") {
        console.debug(
          `User ${userId} not found, original message: ${options.messageContent}`,
        );
      }
      // try {
      //   options.client.reactions.remove(
      //     {
      //       channel: options.channelId,
      //       timestamp: options.messageTs,
      //       name: "white_check_mark",
      //     },
      //   );
      // } catch (_err) {
      //   // no reaction present, most likely
      // }
      return;
    }

    // React with :white_check_mark if not already reacted
    const reactions = await options.client.reactions.get({
      channel: options.channelId,
      timestamp: options.messageTs,
    });
    if (
      reactions.message?.reactions &&
      reactions.message.reactions.some((r) => r.name === "white_check_mark")
    ) {
      console.debug("Reaction already exists, skipping reaction addition.");
      return;
    }
    options.client.reactions.add(
      {
        channel: options.channelId,
        timestamp: options.messageTs,
        name: "white_check_mark",
      },
    );
  } catch (err) {
    console.error(err);
    return;
  }
}

async function deactivateAllUnmarkedUsers(
  client: WebClientType,
  userClient: WebClientType,
  channelId: string,
  adminToken: string,
  adminCookie: string,
) {
  const query =
    // `in:#verifications-deactivations after:2025-06-23 -is:thread -unknown`;
  `in:#verifications-deactivations after:2025-06-01 -is:thread`;
  // const messagesWithoutCheck: { text?: string; subtype?: string; reactions?: { name: string }[]; ts?: string }[] = [];
  let continueSearching = true;
  let page = 1;

  while (continueSearching) {
    const result = await userClient.search.messages({
      query: query,
      page: page,
    });
    if (result.messages) {
      const messages = result.messages.matches ?? [];
      console.debug(`Found ${messages.length} messages`, result);
      for (const msg of messages) {
        if (msg.text == "") {
          let combinedText = "";
          for (const block of msg.blocks || []) {
            if (block.text){
              combinedText += (block.text.text + "\n");``
            }
          }
          msg.text = combinedText.trim();
        }
        if (msg.ts && msg.username === "identi-tea") {
          const reactions = client.reactions.get({
            channel: channelId,
            timestamp: msg.ts || "",
          });
          const hasCheck = ((await reactions).message?.reactions || []).some((
            r,
          ) => r.name === "white_check_mark");
          if (!hasCheck) {
            // console.debug(`Message without checkmark: ${msg.text}`);
            // if (true) {
            await parseAndDeactivate(
              {
                messageContent: msg.text || "",
                channelId: channelId,
                messageTs: msg.ts || "",
                client: client,
                userId: "",
                adminToken: adminToken,
                adminCookie: adminCookie,
              },
            );
          } else {
            // console.debug(
              // `Message with checkmark, skipping: ${msg.text}`,
            // );
          }
        } else{
          console.debug(
            `Skipping message without timestamp or not from identi-tea: ${msg.text}`,
          );
        }
      }
      const currentPage = result.messages.pagination?.page || 1;
      const totalPages = result.messages.pagination?.page_count || 1;
      if (currentPage >= totalPages) {
        continueSearching = false;
        console.debug("No more pages to search.");
      }
      console.debug(`Last page: ${currentPage}, Total pages: ${totalPages}`);
      page++;
    }
    // console.debug(`Found ${messagesWithoutCheck.length} messages without checkmark`);
    // return messagesWithoutCheck;
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 1 second to avoid rate limiting
  }
}

// Okay, I trust if you're reading this, you're not going to go and delete this regex pattern link that I'm probably never going to reference again and that I don't feel like storing the delete URL to.
// https://regex101.com/r/mY8acm/4
// https://regex101.com/DON'Tdelete/EaVW5aHHujMKRecKvbLLJ2ncV6GW27HxvVcZ
app.message(
  /^(?:hey <\!subteam\^S07TQBKCVL7>!(\r\n|\r|\n))?there's someone that needs to be deactivated:/i,
  async ({ body, client }) => {
    console.debug(body);
    const channelId = body.event.channel;
    if (channelId != LOG_CHANNEL) {
      console.debug("Ignoring message not in log channel");
      return;
    }
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

    parseAndDeactivate(
      {
        messageContent: message.text ?? "",
        channelId: channelId,
        messageTs: message.ts ?? "",
        client: client,
        userId: "",
        adminToken: adminToken,
        adminCookie: adminCookie,
      },
    );
  },
);

app.command(
  "/clear-deactivation-backlog",
async ({ ack, respond, client }) => {
  await ack();
  await deactivateAllUnmarkedUsers(
    new WebClient(Deno.env.get("SLACK_BOT_TOKEN") || ""),
    new WebClient(Deno.env.get("SLACK_USER_TOKEN") || ""),
    LOG_CHANNEL,
    adminToken,
    adminCookie,
  );
  respond({
    text: "Cleared deactivation backlog (hopefully)! Check the logs for details.",
  });
  
});


(async () => {
  // Start your app
  await app.start(Deno.env.get("PORT") || 3000);

  app.logger.info("⚡️ Bolt app is running!");
})();
