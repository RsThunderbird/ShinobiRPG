# Menma's Winter World - Cloudflare Pages Deployment

This website is ready to be deployed to Cloudflare Pages.

## Deployment Instructions

1.  **Upload to GitHub:** Create a new GitHub repository and upload the contents of this `website` directory to it.

2.  **Create a Cloudflare Pages Project:**
    *   Log in to your Cloudflare dashboard.
    *   Go to **Workers & Pages**.
    *   Click **Create application** and select the **Pages** tab.
    *   Connect to your GitHub account and select the repository you just created.

3.  **Configure the Build Settings:**
    *   **Framework preset:** Select **None**.
    *   **Build command:** Leave this blank.
    *   **Build output directory:** Set this to `/` (since the repository root is the `website` directory).
    *   Click **Save and Deploy**.

4.  **Configure Environment Variables:**
    *   After your first deployment, go to your project's settings.
    *   Go to **Environment variables**.
    *   Add the following two environment variables:
        *   `DISCORD_CLIENT_ID`: Your Discord application's client ID.
        *   `DISCORD_CLIENT_SECRET`: Your Discord application's client secret.
    *   Redeploy your application for the changes to take effect.

## How it Works

*   **Static Files:** All the files in this directory are served as static assets by Cloudflare Pages.
*   **API and Authentication:** The `functions` directory contains a Cloudflare Worker that handles the Discord OAuth2 login and provides API endpoints for the game.
*   **Routing:** The `_routes.json` file tells Cloudflare Pages to send all requests to `/api/*` to the worker function.
*   **Local Development:** You can use the Cloudflare Wrangler CLI for local development. Make sure you have a `wrangler.toml` file in the parent directory and a `.env` file with your Discord secrets.

**Note:** The Discord authentication flow in this example sends user data back to the client in a URL parameter. For a production application, you should use a more secure method like encrypted cookies or sessions.