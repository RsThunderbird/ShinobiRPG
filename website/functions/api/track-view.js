// Proxy for /api/track-view to handle Mixed Content (HTTPS -> HTTP)
export async function onRequestPost(context) {
    const { request } = context;

    try {
        const body = await request.json();

        // Forward to the HTTP bot server
        // NOTE: Uses the DIRECT IP/Port to ensure it works from Cloudflare's server side
        const botUrl = 'http://play.shinobirpg.online:21788/api/track-view';

        const botResponse = await fetch(botUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const botData = await botResponse.json();

        return new Response(JSON.stringify(botData), {
            headers: { 'Content-Type': 'application/json' },
            status: botResponse.status
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Proxy Error: ' + err.toString() }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}
