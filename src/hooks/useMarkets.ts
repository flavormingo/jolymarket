// markets hook for fetching and filtering markets

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchEvents, parseMarket } from '../services/gamma';
import type { Event, ParsedMarket, Category, SortOption } from '../types';

interface UseMarketsState {
    events: Event[];
    markets: ParsedMarket[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
}

interface UseMarketsActions {
    setCategory: (category: Category) => void;
    setSort: (sort: SortOption) => void;
    setJolyMode: (enabled: boolean) => void;
    loadMore: () => void;
    refresh: () => void;
}

interface UseMarketsReturn extends UseMarketsState, UseMarketsActions {
    category: Category;
    sort: SortOption;
    jolyMode: boolean;
}

// balanced fetch limit - not too slow, decent coverage
const FETCH_LIMIT = 150;
const ITEMS_PER_PAGE = 20;

export function useMarkets(): UseMarketsReturn {
    const [events, setEvents] = useState<Event[]>([]);
    const [markets, setMarkets] = useState<ParsedMarket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    // category and sort persisted to localStorage
    const [category, setCategoryState] = useState<Category>(() => {
        try {
            const saved = localStorage.getItem('jolymarket_category');
            return (saved as Category) || 'all';
        } catch {
            return 'all';
        }
    });

    const [sort, setSortState] = useState<SortOption>(() => {
        try {
            const saved = localStorage.getItem('jolymarket_sort');
            return (saved as SortOption) || 'new';
        } catch {
            return 'new';
        }
    });

    // wrapper functions to persist to localStorage
    const setCategory = useCallback((cat: Category) => {
        setCategoryState(cat);
        setOffset(0);
        try { localStorage.setItem('jolymarket_category', cat); } catch { }
    }, []);

    const setSort = useCallback((s: SortOption) => {
        setSortState(s);
        setOffset(0);
        try { localStorage.setItem('jolymarket_sort', s); } catch { }
    }, []);

    // fetch markets
    const fetchData = useCallback(async (reset = false) => {
        try {
            setIsLoading(true);
            setError(null);

            const currentOffset = reset ? 0 : offset;
            const data = await fetchEvents({
                limit: FETCH_LIMIT,
                offset: currentOffset,
                category,
                sort,
                closed: false
            });

            // extract and parse markets from events
            const newMarkets: ParsedMarket[] = [];
            const now = new Date();

            // regex to detect placeholder market names like "Movie X", "Team A", "Show C", etc.
            const placeholderPattern = /\b(Movie|Team|Player|Candidate|Option|Choice|Artist|Song|Token|Coin|Company|Stock|Show)\s+[A-Z0-9]\b/i;

            for (const event of data) {
                // skip events that have already ended
                const eventEndDate = new Date(event.endDate);
                if (eventEndDate < now && !isNaN(eventEndDate.getTime())) {
                    continue;
                }

                if (event.markets && event.markets.length > 0) {
                    for (const market of event.markets) {
                        // skip placeholder/draft markets
                        if (placeholderPattern.test(market.question)) {
                            continue;
                        }
                        // pass event volume as fallback and event slug for navigation
                        newMarkets.push(parseMarket(market, event.volume, event.slug));
                    }
                }
            }

            if (reset) {
                setEvents(data);
                setMarkets(newMarkets);
                setOffset(ITEMS_PER_PAGE);
            } else {
                setEvents(prev => [...prev, ...data]);
                setMarkets(prev => [...prev, ...newMarkets]);
                setOffset(prev => prev + ITEMS_PER_PAGE);
            }

            setHasMore(data.length === ITEMS_PER_PAGE);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'failed to fetch markets');
        } finally {
            setIsLoading(false);
        }
    }, [category, sort, offset]);

    // initial fetch and when filters change
    useEffect(() => {
        fetchData(true);
    }, [category, sort]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchData(false);
        }
    }, [isLoading, hasMore, fetchData]);

    const refresh = useCallback(() => {
        setOffset(0);
        fetchData(true);
    }, [fetchData]);

    // jolyMode state - persisted to localStorage
    const [jolyMode, setJolyModeState] = useState<boolean>(() => {
        try {
            return localStorage.getItem('jolymarket_jolymode') === 'true';
        } catch {
            return false;
        }
    });

    const setJolyMode = useCallback((enabled: boolean) => {
        setJolyModeState(enabled);
        try {
            localStorage.setItem('jolymarket_jolymode', enabled.toString());
        } catch {
            // ignore localStorage errors
        }
    }, []);

    // filter markets based on jolyMode
    // JolyMode = 90%+ confidence AND $10k+ liquidity AND ending within 30 days
    const filteredMarkets = useMemo(() => {
        if (!jolyMode) return markets;

        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return markets.filter(m => {
            // high confidence: YES >= 90% or NO >= 90% (which means YES <= 10%)
            const highConfidence = m.yesPrice >= 0.9 || m.yesPrice <= 0.1;

            // high liquidity: $10k minimum
            const highLiquidity = m.liquidity >= 10000;

            // ending within 30 days
            const endDate = m.endDate;
            const endingSoon = endDate && !isNaN(endDate.getTime()) && endDate <= thirtyDaysFromNow && endDate > now;

            return highConfidence && highLiquidity && endingSoon;
        });
    }, [markets, jolyMode]);

    return {
        events,
        markets: filteredMarkets,
        isLoading,
        error,
        hasMore,
        category,
        sort,
        jolyMode,
        setCategory,
        setSort,
        setJolyMode,
        loadMore,
        refresh
    };
}
