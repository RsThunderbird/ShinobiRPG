// A lightweight router for Cloudflare Workers
const Router = () => new Proxy({}, {
  get: (obj, prop) => (route, ...handlers) => {
    (obj[prop] = obj[prop] || []).push([
      new RegExp(`^${route.replace(/(\/?)\*(\??)/g, '$1.*$2').replace(/:(\w+)(\??)/g, '(?<$1>[^/]+)$2')}$`),
      handlers
    ])
    return obj
  }
})

const router = Router()

// Helper for JSON responses
const json = (data, options = {}) => new Response(JSON.stringify(data), {
  headers: { 'Content-Type': 'application/json', ...options.headers },
  ...options
})

// Discord OAuth 2 login - Redirect to Discord
router.get('/api/auth/discord/login', (req, env) => {
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&redirect_uri=${new URL(req.url).origin}/api/auth/discord/callback&response_type=code&scope=identify`;
  return new Response(null, {
    status: 302,
    headers: { 'Location': authUrl },
  });
});

// Discord OAuth 2 callback
router.get('/api/auth/discord/callback', async (req, env) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return new Response('No code provided', { status: 400 })
  }

  try {
    // Exchange the code for an access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: new URL(req.url).origin + '/api/auth/discord/callback',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Discord Token API Error:', tokenData)
      return json({ error: 'Failed to fetch token' }, { status: 500 })
    }

    // Fetch user data from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })
    
    const userData = await userResponse.json()

    if (!userResponse.ok) {
        console.error('Discord User API Error:', userData);
        return json({ error: 'Failed to fetch user' }, { status: 500 });
    }

    // In a real app, you would create a session, save data to a DB/KV.
    // For now, we'll redirect back to the home page with user data in params.
    // This is NOT secure for production, but demonstrates the flow.
    const redirectUrl = new URL('/', req.url)
    redirectUrl.searchParams.set('discord_id', userData.id)
    redirectUrl.searchParams.set('username', userData.username)
    redirectUrl.searchParams.set('avatar', userData.avatar)
    
    // Redirect with a 302
    return new Response(null, {
      status: 302,
      headers: { 'Location': redirectUrl.toString() },
    })

  } catch (error) {
    console.error('OAuth Callback Error:', error)
    return json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

// Get player data
router.get('/api/player/:id', async (req) => {
    const { id } = req.params;
    // In a real app, fetch from a database or KV store.
    // Using mock data for now.
    const mockPlayerData = {
        id,
        ryo: Math.floor(Math.random() * 10000),
        snowflakes: Math.floor(Math.random() * 100),
    };
    return json(mockPlayerData);
});

// Grant a reward
router.post('/api/reward', async (req) => {
    try {
        const { userId, reward } = await req.json();
        console.log(`Granting reward to ${userId}:`, reward);
        // In a real app, you'd update the player's data in a database.
        // For now, just log it and return a success message.
        return json({ success: true, message: 'Reward granted (mock)' });
    } catch (error) {
        return json({ success: false, error: 'Invalid request' }, { status: 400 });
    }
});

// 404 handler
const handle404 = () => new Response('Not Found', { status: 404 });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const match = router[request.method.toLowerCase()]?.find(([regex]) => regex.test(url.pathname))

    if (match) {
      try {
        const [regex, handlers] = match
        const params = url.pathname.match(regex)?.groups || {}
        request.params = params
        for (const handler of handlers) {
          const response = await handler(request, env, ctx)
          if (response) return response
        }
      } catch (error) {
        console.error('Router Error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
    
    // If no API route matches, return a 404.
    // In a real setup, you might want to let the request fall through
    // to Cloudflare Pages static asset serving. The presence of a `_routes.json`
    // or similar configuration would control this behavior. For a functions-only
    // setup, this is fine.
    return handle404();
  },
};
