// Handle /api/complete-story
export async function onRequest(context) {
    const { request } = context;

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const data = await request.json();
        console.log('Story completion:', data);

        // In a real app, this would write to KV or D1 Database
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Story completion recorded (Simulation)'
            }),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.toString() }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
