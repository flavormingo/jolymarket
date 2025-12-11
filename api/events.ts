// Vercel Edge Function for caching Polymarket API responses
// This runs on Vercel's edge network, caching responses for 5 minutes

export const config = {
    runtime: 'edge',
};

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const CACHE_TTL = 300; // 5 minutes in seconds

// In-memory cache for edge function (persists between requests while warm)
const cache = new Map<string, { data: unknown; timestamp: number }>();

export default async function handler(request: Request) {
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const cacheKey = `events_${searchParams}`;

    // Check in-memory cache
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL * 1000) {
        return new Response(JSON.stringify(cached.data), {
            headers: {
                'Content-Type': 'application/json',
                'X-Cache': 'HIT',
                'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=60`,
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    // Fetch from Polymarket API
    try {
        const response = await fetch(`${GAMMA_API_BASE}/events?${searchParams}`);

        if (!response.ok) {
            throw new Error(`Polymarket API error: ${response.status}`);
        }

        const data = await response.json();

        // Store in cache
        cache.set(cacheKey, { data, timestamp: now });

        // Clean old cache entries (keep max 100)
        if (cache.size > 100) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey) cache.delete(oldestKey);
        }

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'X-Cache': 'MISS',
                'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=60`,
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to fetch from Polymarket' }),
            {
                status: 502,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}
