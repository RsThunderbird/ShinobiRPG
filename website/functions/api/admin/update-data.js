// Proxy for /api/admin/update-data
export async function onRequestPost(context) {
    const { request } = context;

    // Headers to pass along
    const adminId = request.headers.get('x-admin-id');
    const body = await request.json();

    try {
        // Forward to the bot server (Pterodactyl)
        const botUrl = `http://us2.bot-hosting.net:21788/api/admin/update-data`;

        const botResponse = await fetch(botUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-id': adminId
            },
            body: JSON.stringify(body)
        });

        const botData = await botResponse.json();

        return new Response(JSON.stringify(botData), {
            headers: { 'Content-Type': 'application/json' },
            status: botResponse.status
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Proxy Error: ' + err.toString(), success: false }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}
