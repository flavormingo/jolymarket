// Polymarket CLOB proxy server for Railway
// Bypasses Cloudflare blocking by using Railway's IP pool

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const CLOB_API = 'https://clob.polymarket.com';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'jolymarket-proxy' });
});

// Proxy endpoint - accepts POST with {path, method, headers, body}
app.post('/proxy', async (req, res) => {
    try {
        const { path, method, headers, body } = req.body;

        console.log(`[proxy] ${method} ${path}`);

        const response = await fetch(`${CLOB_API}${path}`, {
            method: method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'JolyMarket/1.0',
                ...headers
            },
            body: body || undefined
        });

        const responseText = await response.text();
        console.log(`[proxy] response: ${response.status} ${responseText.substring(0, 100)}`);

        // Try to parse as JSON, fallback to raw text
        try {
            res.status(response.status).json(JSON.parse(responseText));
        } catch {
            res.status(response.status).json({ raw: responseText });
        }
    } catch (error) {
        console.error('[proxy] error:', error);
        res.status(500).json({ error: 'proxy failed', details: String(error) });
    }
});

app.listen(PORT, () => {
    console.log(`JolyMarket proxy running on port ${PORT}`);
});
