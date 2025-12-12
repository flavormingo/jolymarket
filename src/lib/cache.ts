interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_PREFIX = 'jolymarket_cache_';
const DEFAULT_TTL = 5 * 60 * 1000;

export function getCached<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;

        const entry: CacheEntry<T> = JSON.parse(raw);
        const now = Date.now();

        if (now - entry.timestamp > DEFAULT_TTL) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

export function setCache<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
    }
}

export function clearCache(): void {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {
    }
}

export function makeCacheKey(params: Record<string, unknown>): string {
    return Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
}
