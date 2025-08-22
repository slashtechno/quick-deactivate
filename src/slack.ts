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

export async function getUserEmail(client: WebClientType, targetUserId: string): Promise<string> {
  const user = await client.users.info({ user: targetUserId });
  return user.user?.profile?.email ?? "Unknown";
}

export async function isUserAdmin(client: WebClientType, userId: string): Promise<boolean> {
  const profile = await client.users.info(
    {
      user: userId,
    },
  );
  return profile.user?.is_admin == true;
}

/**
 * Extracts the first Slack user ID from text using regex pattern
 * @param text - The text to search for user IDs
 * @returns The first found user ID, or null if none found
 */
export function extractFirstUserId(text: string): string | null {
  const userIdRegex = /U[A-Z0-9]+/g;
  const matches = text.match(userIdRegex);
  return matches && matches.length > 0 ? matches[0] : null;
}




export const app = new App({
  token: Deno.env.get("SLACK_BOT_TOKEN"),
  socketMode: true,
  appToken: Deno.env.get("SLACK_APP_TOKEN"),
});
  
app.command("/get-email", async ({ ack, command, client, respond }) => {
  await ack();
  
  // Check if the calling user is an admin
  if (!(await isUserAdmin(client, command.user_id))) {
    respond({
      text: "You are not an admin, so you cannot use this command.",
    });
    return;
  }
  
  // Check if user provided a target user ID in the command text
  const targetUserId = extractFirstUserId(command.text || "");
  
  if (targetUserId) {
    try {
      const email = await getUserEmail(client, targetUserId);
      const userInfo = await client.users.info({ user: targetUserId });
      const user = userInfo.user;
      
      const displayName = user?.profile?.display_name || user?.profile?.real_name || "Unknown";
      const username = user?.name || "Unknown";
      const fullName = user?.profile?.real_name || "Unknown";
      
      respond({
        text: `User: ${targetUserId}\nDisplay Name: ${displayName}\nUsername: ${username}\nFull Name: ${fullName}\nEmail: ${email}`,
      });
    } catch (error) {
      respond({
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  } else {
    respond({
      text: "Please provide a user ID. Usage: `/get-email U1234567890`",
    });
  }
});
