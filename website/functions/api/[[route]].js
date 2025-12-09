export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle the user's specific redirect URI: /oauth/callback
        // adapting it to use the same logic as our API
        if (url.pathname === '/oauth/callback') {
            return handleDiscordCallback(request, env);
        }

        // Router for other API paths
        if (url.pathname.startsWith('/api/')) {
            if (url.pathname === '/api/auth/discord/login') return handleDiscordLogin(request, env);
            if (url.pathname === '/api/auth/discord/callback') return handleDiscordCallback(request, env);
            if (url.pathname.startsWith('/api/player/')) return handleGetPlayer(request);
            if (url.pathname === '/api/reward') return handleReward(request);
            if (url.pathname === '/api/complete-story') return handleCompleteStory(request); // New endpoint
        }

        // Fallback for non-API routes (Cloudflare Pages handles static assets)
        return new Response('Not Found', { status: 404 });
    }
};

// Handlers

async function handleDiscordLogin(req, env) {
    const redirectUri = `${new URL(req.url).origin}/oauth/callback`; // Match the user's setting
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    return new Response(null, {
        status: 302,
        headers: { 'Location': authUrl },
    });
}

async function handleDiscordCallback(req, env) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) return new Response('No code provided', { status: 400 });

    try {
        // Exchange code for token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: env.DISCORD_CLIENT_ID,
                client_secret: env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${url.origin}/oauth/callback`, // Must match exactly
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) return new Response(JSON.stringify(tokenData), { status: 500 });

        // Get User Data
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userResponse.json();

        // Redirect Home with Data
        const redirectUrl = new URL('/', req.url);
        redirectUrl.searchParams.set('discord_id', userData.id);
        redirectUrl.searchParams.set('username', userData.username);
        redirectUrl.searchParams.set('avatar', userData.avatar);

        return new Response(null, {
            status: 302,
            headers: { 'Location': redirectUrl.toString() },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.toString() }), { status: 500 });
    }
}

// Mock Data Handlers (Since we can't write to local JSON)

function handleGetPlayer(req) {
    // Return dummy data
    return new Response(JSON.stringify({ id: 'guest', ryo: 0 }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handleReward(req) {
    return new Response(JSON.stringify({ success: true, message: "Reward processed (Simulation)" }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handleCompleteStory(req) {
    // In a real app, this would write to KV or D1 Database
    return new Response(JSON.stringify({ success: true, message: "Story completion recorded (Simulation)" }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
