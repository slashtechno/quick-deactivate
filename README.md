# Quick deactivate

This is a Slack bot built for [Hack Club](https://hackclub.com), a nonprofit
organization serving as both a community for high-school programmers, makers,
and hackers, but also as a resource hub providing grants and incentives, such as
free laptops, Flipper Zeros, and a lot [more](https://summer.hackclub.com/).
These programs are <=18 but we get many adults or people who want to defraud
these programs trying to joining. We quickly identify them, but deactivating
manually can get difficult as we need to deactivate more and more accounts. This
tool aims to automate that by allowing us to simply react to a message sent by
our existing verification infrastructure to quickly confirm the deactivation of
a user.

## Installation & Running

### Using Docker Compose

1. Copy `sample.env` to `.env` and fill in your environment variables.
2. Build and start the service:
   ```sh
   docker compose up --build
   ```
   This will build the Docker image and run the app using `main.ts` with all permissions.

### Using Deno Directly

1. Install [Deno](https://deno.com/manual/getting_started/installation) if you haven't already.
2. Copy `sample.env` to `.env` and fill in your environment variables.
3. Run the app:
   ```sh
   deno run --allow-all --env-file main.ts 
   ```

## Slack Commands

### `/deactivate @username`
Deactivates the specified user (e.g., `/deactivate @username`). Only workspace admins can use this command. If successful, the user will be deactivated and a log will be sent to the webhook.

### `/clear-deactivation-backlog`
Scans the #verifications-deactivations channel for unmarked messages and attempts to deactivate users who have not already been processed. Only workspace admins can use this command.
