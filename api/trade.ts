// vercel serverless function to proxy polymarket clob trading requests
// this runs on aws lambda (different IPs than edge functions)

export const config = {
    runtime: 'nodejs20.x', // node.js runtime, not edge
};

const CLOB_API = 'https://clob.polymarket.com';

interface RequestBody {
    path: string;
    method: 'GET' | 'POST' | 'DELETE';
    headers: Record<string, string>;
    body?: string;
}

export default async function handler(req: Request): Promise<Response> {
    // handle preflight cors
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, POLY_ADDRESS, POLY_SIGNATURE, POLY_TIMESTAMP, POLY_NONCE, POLY_API_KEY, POLY_PASSPHRASE',
            },
        });
    }

    try {
        const requestData: RequestBody = await req.json();
        const { path, method, headers, body } = requestData;

        console.log(`proxying ${method} ${path}`);

        // make request to polymarket clob api
        const response = await fetch(`${CLOB_API}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'JolyMarket/1.0',
                ...headers,
            },
            body: body || undefined,
        });

        const responseText = await response.text();
        console.log(`response: ${response.status} ${responseText.substring(0, 200)}`);

        return new Response(responseText, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('proxy error:', error);
        return new Response(JSON.stringify({ error: 'proxy failed', details: String(error) }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
