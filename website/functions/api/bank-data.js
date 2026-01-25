// Proxy for /api/bank-data to handle Mixed Content (HTTPS -> HTTP)
export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing userId', success: false }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400
        });
    }

    try {
        // Forward to the HTTP bot server
        const botUrl = `http://us2.bot-hosting.net:21788/api/bank-data?userId=${userId}`;

        const botResponse = await fetch(botUrl);
        const responseText = await botResponse.text();

        let botData;
        try {
            botData = JSON.parse(responseText);
        } catch (e) {
            return new Response(JSON.stringify({
                error: 'Proxy received Non-JSON response from Bot',
                details: responseText.substring(0, 500)
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 502
            });
        }

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
