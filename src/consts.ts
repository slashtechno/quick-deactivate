export const ADMIN_TOKEN = Deno.env.get("SLACK_ADMIN_TOKEN") || "";
export const ADMIN_COOKIE = `d=${Deno.env.get("SLACK_ADMIN_COOKIE")}`;
export const LOG_CHANNEL = "C07U4A62KL3";
export const DEACTIVATED_USERS_LOG_WEBHOOK_URL =
  Deno.env.get("DEACTIVATED_USERS_LOG_WEBHOOK_URL") || "";
export const PROTECTED_USER_IDS = ["U075RTSLDQ8", "U093HR5GN82"];