export async function onRequest(context) {
    const { env } = context;
    const clientId = env.DISCORD_CLIENT_ID || '1351258977018839041';

    // Determine the origin for the redirect URI
    const url = new URL(context.request.url);
    const redirectUri = `${url.origin}/oauth/callback`;

    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;

    return Response.redirect(discordAuthUrl, 302);
}
