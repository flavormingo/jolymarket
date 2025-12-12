// vercel serverless function to proxy polymarket clob trading requests
// this runs on node.js runtime (not edge) to avoid Cloudflare blocking

import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLOB_API = 'https://clob.polymarket.com';

interface RequestBody {
    path: string;
    method: 'GET' | 'POST' | 'DELETE';
    headers: Record<string, string>;
    body?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // set cors headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // handle preflight cors
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        const requestData = req.body as RequestBody;
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

        return res.status(response.status).json(
            responseText.startsWith('{') || responseText.startsWith('[')
                ? JSON.parse(responseText)
                : { raw: responseText }
        );
    } catch (error) {
        console.error('proxy error:', error);
        return res.status(500).json({ error: 'proxy failed', details: String(error) });
    }
}
