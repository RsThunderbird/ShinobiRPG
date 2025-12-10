// Proxy for /api/track-view to handle Mixed Content (HTTPS -> HTTP)
export async function onRequestPost(context) {
    const { request } = context;

    try {
        const body = await request.json();

        // Forward to the HTTP bot server
        // Using the direct BotHosting alias provided by the user to avoid DNS issues
        const botUrl = 'http://7a2dbc1e-52dc-41a5-92c9-7053a8fc8cee.site.bot-hosting.net/api/track-view';

        const botResponse = await fetch(botUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const responseText = await botResponse.text();
        let botData;
        try {
            botData = JSON.parse(responseText);
        } catch (e) {
            // It wasn't JSON (likely HTML error page)
            return new Response(JSON.stringify({
                error: 'Proxy received Non-JSON response from Bot',
                details: responseText.substring(0, 500) // First 500 chars of HTML
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 502 // Bad Gateway
            });
        }

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
