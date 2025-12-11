// polymarket gamma api service
// uses vite proxy in dev, vercel edge function in production for caching

import type { Event, Market, ParsedMarket, Category, SortOption, Tag } from '../types';
import { getCached, setCache, makeCacheKey } from '../lib/cache';

// use vite proxy in development, vercel rewrite proxy in production
// this avoids CORS issues by routing through our own domain
const GAMMA_API_BASE = '/api/gamma';

// for all endpoints - same base (vercel.json rewrites to polymarket)
const GAMMA_API_DIRECT = '/api/gamma';

// category to tag slug mapping
const CATEGORY_SLUGS: Record<Category, string | null> = {
    'all': null,
    'crypto': 'crypto',
    'culture': 'pop-culture',
    'earnings': 'earnings',
    'economy': 'economy',
    'elections': 'elections',
    'finance': 'finance',
    'geopolitics': 'geopolitics',
    'politics': 'politics',
    'sports': 'sports',
    'tech': 'tech',
    'world': 'world'
};

interface FetchEventsParams {
    limit?: number;
    offset?: number;
    closed?: boolean;
    category?: Category;
    sort?: SortOption;
}

// fetch events with markets (with localStorage caching)
export async function fetchEvents(params: FetchEventsParams = {}): Promise<Event[]> {
    const {
        limit = 50,
        offset = 0,
        closed = false,
        category = 'all',
        sort = 'trending'
    } = params;

    // check cache first
    const cacheKey = `events_${makeCacheKey({ limit, offset, closed, category })}`;
    const cached = getCached<Event[]>(cacheKey);
    if (cached) {
        console.log('[cache hit]', cacheKey);
        return sortEvents(cached, sort);
    }

    const searchParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        closed: closed.toString(),
        order: 'id',
        ascending: 'false' // newest first (higher id = newer)
    });

    // add tag filter if category specified (use tag_slug, not tag)
    const tagSlug = CATEGORY_SLUGS[category];
    if (tagSlug) {
        searchParams.append('tag_slug', tagSlug);
    }

    try {
        const response = await fetch(`${GAMMA_API_BASE}/events?${searchParams}`);
        if (!response.ok) {
            throw new Error(`gamma api error: ${response.status}`);
        }
        const events: Event[] = await response.json();

        // cache the response
        setCache(cacheKey, events);
        console.log('[cache set]', cacheKey);

        // apply sorting
        return sortEvents(events, sort);
    } catch (error) {
        console.error('failed to fetch events:', error);
        throw error;
    }
}

// fetch single event by slug
export async function fetchEventBySlug(slug: string): Promise<Event | null> {
    try {
        const response = await fetch(`${GAMMA_API_DIRECT}/events?slug=${slug}`);
        if (!response.ok) {
            throw new Error(`gamma api error: ${response.status}`);
        }
        const events: Event[] = await response.json();
        return events[0] || null;
    } catch (error) {
        console.error('failed to fetch event:', error);
        throw error;
    }
}

// fetch single market by id
export async function fetchMarketById(id: string): Promise<Market | null> {
    try {
        const response = await fetch(`${GAMMA_API_DIRECT}/markets/${id}`);
        if (!response.ok) {
            throw new Error(`gamma api error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('failed to fetch market:', error);
        throw error;
    }
}

// fetch available tags
export async function fetchTags(): Promise<Tag[]> {
    try {
        const response = await fetch(`${GAMMA_API_DIRECT}/tags`);
        if (!response.ok) {
            throw new Error(`gamma api error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('failed to fetch tags:', error);
        throw error;
    }
}

// search markets
export async function searchMarkets(query: string, limit = 20): Promise<Market[]> {
    try {
        const response = await fetch(
            `${GAMMA_API_DIRECT}/markets?_q=${encodeURIComponent(query)}&limit=${limit}&closed=false`
        );
        if (!response.ok) {
            throw new Error(`gamma api error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('failed to search markets:', error);
        throw error;
    }
}

// parse market data for display
// eventVolume is optional fallback when market.volume is empty
// eventSlug is required for navigation (event and market slugs differ)
export function parseMarket(market: Market, eventVolume?: number | string, eventSlug?: string): ParsedMarket {
    // parse outcome prices - format: "[0.65,0.35]" for yes,no
    let yesPrice = 0.5;
    let noPrice = 0.5;

    try {
        if (market.outcomePrices) {
            const prices = JSON.parse(market.outcomePrices);
            if (Array.isArray(prices) && prices.length >= 2) {
                yesPrice = parseFloat(prices[0]) || 0.5;
                noPrice = parseFloat(prices[1]) || 0.5;
            }
        }
    } catch {
        // use defaults
    }

    // parse token ids
    let yesTokenId = '';
    let noTokenId = '';

    try {
        if (market.clobTokenIds) {
            const tokenIds = JSON.parse(market.clobTokenIds);
            if (Array.isArray(tokenIds) && tokenIds.length >= 2) {
                yesTokenId = tokenIds[0] || '';
                noTokenId = tokenIds[1] || '';
            }
        }
    } catch {
        // use defaults
    }

    // extract tag labels
    const tags = market.tags?.map(t => t.label || t.slug) || [];

    // parse volume - API may return string or number, use event volume as fallback
    let volume = 0;
    if (market.volume) {
        volume = typeof market.volume === 'string' ? parseFloat(market.volume) : market.volume;
    }
    if (!volume && eventVolume) {
        volume = typeof eventVolume === 'string' ? parseFloat(eventVolume as string) : eventVolume;
    }

    // parse liquidity similarly
    let liquidity = 0;
    if (market.liquidity) {
        liquidity = typeof market.liquidity === 'string' ? parseFloat(market.liquidity as unknown as string) : market.liquidity;
    }

    return {
        id: market.id,
        question: market.question,
        description: market.description || '',
        image: market.image || '',
        slug: market.slug,
        eventSlug: eventSlug || market.slug, // use event slug for navigation, fallback to market slug
        endDate: new Date(market.endDate),
        volume,
        liquidity,
        yesPrice,
        noPrice,
        yesTokenId,
        noTokenId,
        conditionId: market.conditionId || '',
        active: market.active && !market.closed,
        closed: market.closed,
        tags
    };
}

// sort events based on option
function sortEvents(events: Event[], sort: SortOption): Event[] {
    switch (sort) {
        case 'trending':
            // sort by volume (most traded) - handle string volumes
            return [...events].sort((a, b) => {
                const volA = typeof a.volume === 'string' ? parseFloat(a.volume) : (a.volume || 0);
                const volB = typeof b.volume === 'string' ? parseFloat(b.volume) : (b.volume || 0);
                return volB - volA;
            });

        case 'new':
            // sort by creation date (newest first)
            return [...events].sort((a, b) => {
                // use id as fallback (higher id = newer)
                const idA = parseInt(a.id) || 0;
                const idB = parseInt(b.id) || 0;
                return idB - idA;
            });

        case 'ending-soon':
            // sort by end date ascending
            return [...events].sort((a, b) => {
                const dateA = new Date(a.endDate).getTime();
                const dateB = new Date(b.endDate).getTime();
                return dateA - dateB;
            });

        default:
            return events;
    }
}

// format volume for display
export function formatVolume(volume: number | string): string {
    // ensure volume is a number
    const vol = typeof volume === 'string' ? parseFloat(volume) : volume;
    if (isNaN(vol) || vol === 0) {
        return '$0';
    }
    if (vol >= 1000000) {
        return `$${(vol / 1000000).toFixed(1)}m`;
    }
    if (vol >= 1000) {
        return `$${(vol / 1000).toFixed(1)}k`;
    }
    return `$${Math.round(vol)}`;
}

// format time remaining
export function formatTimeRemaining(endDate: Date): string {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    // handle invalid dates
    if (isNaN(diff)) {
        return 'TBD';
    }

    if (diff < 0) {
        return 'ended';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 30) {
        const months = Math.floor(days / 30);
        return `${months}mo`;
    }
    if (days > 0) {
        return `${days}d`;
    }
    if (hours > 0) {
        return `${hours}h`;
    }

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
}
