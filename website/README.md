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
