import { DEACTIVATED_USERS_LOG_WEBHOOK_URL } from "./consts.ts";
import pkg from "npm:@slack/bolt";
import { WebClient as WebClientType } from "npm:@slack/web-api";
const { App } = pkg;


export async function sendMessageToSlackWebhook(
    message: string,
    webhookUrl: string = DEACTIVATED_USERS_LOG_WEBHOOK_URL,
  ) {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
      }),
    });
    if (!resp.ok) {
      console.error("Failed to send message to Slack webhook:", resp.statusText);
    }
  }

export async function getUserEmail(client: WebClientType, targetUserId: string, callingUserId: string): Promise<string> {
  if (await isUserAdmin(client, callingUserId)) {
    const user = await client.users.info({ user: targetUserId });
    return user.user?.profile?.email ?? "Unknown";
  }
  throw new Error("User is not an admin");
}

export async function isUserAdmin(client: WebClientType, userId: string): Promise<boolean> {
  const profile = await client.users.info(
    {
      user: userId,
    },
  );
  return profile.user?.is_admin == true;
}


export const app = new App({
  token: Deno.env.get("SLACK_BOT_TOKEN"),
  socketMode: true,
  appToken: Deno.env.get("SLACK_APP_TOKEN"),
});
  
app.command("/get-email", async ({ ack, command, client, respond }) => {
  await ack();
  const email = await getUserEmail(client, command.user_id, command.user_id);
  respond({
    text: `The email for ${command.user_id} is ${email}`,
  });
});
