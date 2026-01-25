// Proxy for /api/admin/get-data
export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const targetId = url.searchParams.get('targetId');
    const adminId = url.searchParams.get('adminId');

    if (!targetId || !adminId) {
        return new Response(JSON.stringify({ error: 'Missing parameters', success: false }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400
        });
    }

    try {
        // Forward to the bot server (Pterodactyl)
        const botUrl = `http://us2.bot-hosting.net:21788/api/admin/get-data?targetId=${targetId}&adminId=${adminId}`;

        const botResponse = await fetch(botUrl);
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
