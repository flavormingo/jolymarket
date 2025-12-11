// tabbed price chart and order book component

import { useState, useEffect } from 'react';
import { getOrderBook, getPriceHistory, type PriceHistoryPoint } from '../services/clob';
import type { ParsedMarket } from '../types';

interface PriceChartOrderBookProps {
    market: ParsedMarket;
}

type Tab = 'chart' | 'orderbook';

interface OrderBookData {
    bids: Array<{ price: string; size: string }>;
    asks: Array<{ price: string; size: string }>;
}

interface ChartPoint {
    time: number;
    price: number;
}

export function PriceChartOrderBook({ market }: PriceChartOrderBookProps) {
    const [activeTab, setActiveTab] = useState<Tab>('chart');
    const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
    const [priceHistory, setPriceHistory] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartError, setChartError] = useState<string | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);

    // fetch real price history on mount
    useEffect(() => {
        if (market.yesTokenId) {
            const fetchPriceHistory = async () => {
                try {
                    setChartLoading(true);
                    setChartError(null);
                    console.log('fetching price history for token:', market.yesTokenId);
                    // fetch max history with 15-min resolution for more data points
                    const history = await getPriceHistory(market.yesTokenId, 'max', 15);
                    console.log('price history response:', history?.length, 'points');

                    if (history && history.length > 0) {
                        // take last 48 points (12 hours at 15-min intervals) if available
                        const recentHistory = history.slice(-48);
                        const points: ChartPoint[] = recentHistory.map((point: PriceHistoryPoint) => ({
                            time: point.t * 1000, // convert to milliseconds
                            price: point.p
                        }));

                        // always add current price as the final point for accuracy
                        const now = Date.now();
                        const lastPoint = points[points.length - 1];
                        if (!lastPoint || now - lastPoint.time > 5 * 60 * 1000) {
                            // add current price if last point is older than 5 minutes
                            points.push({ time: now, price: market.yesPrice });
                        }

                        setPriceHistory(points);
                    } else {
                        console.log('no price history returned for this market');
                        // if no data, create a simple 2-point line at current price
                        const now = Date.now();
                        setPriceHistory([
                            { time: now - 60 * 60 * 1000, price: market.yesPrice },
                            { time: now, price: market.yesPrice }
                        ]);
                    }
                } catch (err) {
                    console.error('price history error:', err);
                    setChartError('failed to load price history');
                    // fallback: create a simple line at current price
                    const now = Date.now();
                    setPriceHistory([
                        { time: now - 60 * 60 * 1000, price: market.yesPrice },
                        { time: now, price: market.yesPrice }
                    ]);
                } finally {
                    setChartLoading(false);
                }
            };
            fetchPriceHistory();
        } else {
            // no token id - just show current price as flat line
            console.log('no yesTokenId, showing current price only');
            const now = Date.now();
            setPriceHistory([
                { time: now - 60 * 60 * 1000, price: market.yesPrice },
                { time: now, price: market.yesPrice }
            ]);
            setChartLoading(false);
        }
    }, [market.yesTokenId, market.yesPrice]);

    // fetch order book when tab changes
    useEffect(() => {
        if (activeTab === 'orderbook' && market.yesTokenId) {
            const fetchOrderBook = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const data = await getOrderBook(market.yesTokenId);
                    setOrderBook(data);
                } catch (err) {
                    setError('failed to load order book');
                    console.error('order book error:', err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchOrderBook();
        }
    }, [activeTab, market.yesTokenId]);

    // format time for tooltip
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // handle chart interaction (hover/tap)
    const handleChartInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();

        let clientX: number;
        if ('touches' in e) {
            clientX = e.touches[0]?.clientX ?? 0;
        } else {
            clientX = e.clientX;
        }

        const x = clientX - rect.left;
        const chartWidth = rect.width;
        const pointWidth = chartWidth / (priceHistory.length - 1);
        const index = Math.round(x / pointWidth);

        if (index >= 0 && index < priceHistory.length) {
            setHoveredPoint({
                index,
                x: index * pointWidth,
                y: 0 // will be calculated in render
            });
        }
    };

    const handleChartLeave = () => {
        setHoveredPoint(null);
    };

    // render responsive chart with hover/tap
    const renderChart = () => {
        // show loading state
        if (chartLoading) {
            return (
                <div className="loading" style={{ padding: 'var(--space-xl)' }}>
                    <div className="loading-spinner" />
                    <span>loading price history...</span>
                </div>
            );
        }

        // show error state
        if (chartError) {
            return (
                <div style={{
                    padding: 'var(--space-xl)',
                    textAlign: 'center',
                    color: 'var(--accent-danger)'
                }}>
                    {chartError}
                </div>
            );
        }

        // handle empty or single-point data
        if (priceHistory.length < 2) {
            return (
                <div style={{
                    padding: 'var(--space-xl)',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                }}>
                    no price history available yet
                </div>
            );
        }

        const maxPrice = Math.max(...priceHistory.map(p => p.price));
        const minPrice = Math.min(...priceHistory.map(p => p.price));
        const range = maxPrice - minPrice || 0.1;
        const height = 150;
        const padding = 10;

        // calculate hovered point position
        const hoveredData = hoveredPoint ? priceHistory[hoveredPoint.index] : null;

        return (
            <div style={{ padding: 'var(--space-md)' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-sm)',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)'
                }}>
                    <span>24h price chart</span>
                    <span>current: {Math.round(market.yesPrice * 100)}¢</span>
                </div>

                {/* tooltip for hovered point */}
                {hoveredData && (
                    <div style={{
                        background: 'var(--bg-primary)',
                        border: '2px solid var(--accent-primary)',
                        padding: 'var(--space-xs) var(--space-sm)',
                        marginBottom: 'var(--space-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.875rem',
                        fontFamily: 'var(--font-heading)'
                    }}>
                        <span style={{ color: 'var(--text-muted)' }}>{formatTime(hoveredData.time)}</span>
                        <span style={{ color: 'var(--accent-success)' }}>{Math.round(hoveredData.price * 100)}¢</span>
                    </div>
                )}

                <div style={{
                    background: 'var(--bg-tertiary)',
                    border: '2px solid var(--border-color)',
                    padding: 'var(--space-sm)',
                    position: 'relative'
                }}>
                    <svg
                        width="100%"
                        height={height}
                        viewBox={`0 0 100 ${height}`}
                        preserveAspectRatio="none"
                        style={{ display: 'block', cursor: 'crosshair' }}
                        onMouseMove={handleChartInteraction}
                        onMouseLeave={handleChartLeave}
                        onTouchStart={handleChartInteraction}
                        onTouchMove={handleChartInteraction}
                        onTouchEnd={handleChartLeave}
                    >
                        {/* grid lines */}
                        {[0, 25, 50, 75, 100].map(pct => (
                            <line
                                key={pct}
                                x1={0}
                                y1={height - (pct / 100) * (height - padding * 2) - padding}
                                x2={100}
                                y2={height - (pct / 100) * (height - padding * 2) - padding}
                                stroke="var(--border-color)"
                                strokeWidth="0.5"
                                strokeDasharray="1,1"
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}

                        {/* filled area under the line */}
                        <polygon
                            fill="rgba(16, 185, 129, 0.1)"
                            points={[
                                ...priceHistory.map((p, i) => {
                                    const x = (i / (priceHistory.length - 1)) * 100;
                                    const y = height - ((p.price - minPrice) / range) * (height - padding * 2) - padding;
                                    return `${x},${y}`;
                                }),
                                `100,${height - padding}`,
                                `0,${height - padding}`
                            ].join(' ')}
                        />

                        {/* price line */}
                        <polyline
                            fill="none"
                            stroke="var(--accent-success)"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                            points={priceHistory.map((p, i) => {
                                const x = (i / (priceHistory.length - 1)) * 100;
                                const y = height - ((p.price - minPrice) / range) * (height - padding * 2) - padding;
                                return `${x},${y}`;
                            }).join(' ')}
                        />

                        {/* hover indicator line only - circle is HTML element */}
                        {hoveredPoint && (
                            <line
                                x1={(hoveredPoint.index / (priceHistory.length - 1)) * 100}
                                y1={padding}
                                x2={(hoveredPoint.index / (priceHistory.length - 1)) * 100}
                                y2={height - padding}
                                stroke="var(--accent-primary)"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                    </svg>

                    {/* perfect circle marker - positioned HTML element */}
                    {hoveredPoint && (
                        <div
                            style={{
                                position: 'absolute',
                                left: `calc(${(hoveredPoint.index / (priceHistory.length - 1)) * 100}% + var(--space-sm))`,
                                top: `calc(${((1 - (priceHistory[hoveredPoint.index].price - minPrice) / range) * (height - padding * 2) + padding) / height * 100}% + var(--space-sm))`,
                                transform: 'translate(-50%, -50%)',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: 'var(--accent-primary)',
                                border: '2px solid var(--bg-primary)',
                                pointerEvents: 'none'
                            }}
                        />
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 'var(--space-sm)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                }}>
                    <span>24h ago</span>
                    <span style={{ fontSize: '0.625rem', fontStyle: 'italic' }}>tap/hover for details</span>
                    <span>now</span>
                </div>
            </div>
        );
    };

    // render order book
    const renderOrderBook = () => {
        if (isLoading) {
            return (
                <div className="loading" style={{ padding: 'var(--space-xl)' }}>
                    <div className="loading-spinner" />
                    <span>loading order book...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div style={{
                    padding: 'var(--space-xl)',
                    textAlign: 'center',
                    color: 'var(--accent-danger)'
                }}>
                    {error}
                </div>
            );
        }

        if (!orderBook) {
            return (
                <div style={{
                    padding: 'var(--space-xl)',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                }}>
                    no order book data available
                </div>
            );
        }

        const topBids = orderBook.bids?.slice(0, 8) || [];
        const topAsks = orderBook.asks?.slice(0, 8) || [];
        const maxSize = Math.max(
            ...topBids.map(b => parseFloat(b.size)),
            ...topAsks.map(a => parseFloat(a.size)),
            1
        );

        return (
            <div style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    {/* bids (buy orders) */}
                    <div>
                        <h4 style={{
                            fontSize: '0.875rem',
                            color: 'var(--accent-success)',
                            marginBottom: 'var(--space-sm)'
                        }}>
                            bids (buy)
                        </h4>
                        <div style={{
                            background: 'var(--bg-tertiary)',
                            border: '2px solid var(--border-color)',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                padding: 'var(--space-xs) var(--space-sm)',
                                borderBottom: '1px solid var(--border-color)',
                                color: 'var(--text-muted)'
                            }}>
                                <span>price</span>
                                <span style={{ textAlign: 'right' }}>size</span>
                            </div>
                            {topBids.length === 0 ? (
                                <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    no bids
                                </div>
                            ) : (
                                topBids.map((bid, i) => {
                                    const size = parseFloat(bid.size);
                                    const barWidth = (size / maxSize) * 100;
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                padding: 'var(--space-xs) var(--space-sm)',
                                                position: 'relative'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: `${barWidth}%`,
                                                    background: 'rgba(16, 185, 129, 0.15)'
                                                }}
                                            />
                                            <span style={{ position: 'relative', color: 'var(--accent-success)' }}>
                                                {(parseFloat(bid.price) * 100).toFixed(1)}¢
                                            </span>
                                            <span style={{ position: 'relative', textAlign: 'right' }}>
                                                {size.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* asks (sell orders) */}
                    <div>
                        <h4 style={{
                            fontSize: '0.875rem',
                            color: 'var(--accent-danger)',
                            marginBottom: 'var(--space-sm)'
                        }}>
                            asks (sell)
                        </h4>
                        <div style={{
                            background: 'var(--bg-tertiary)',
                            border: '2px solid var(--border-color)',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                padding: 'var(--space-xs) var(--space-sm)',
                                borderBottom: '1px solid var(--border-color)',
                                color: 'var(--text-muted)'
                            }}>
                                <span>price</span>
                                <span style={{ textAlign: 'right' }}>size</span>
                            </div>
                            {topAsks.length === 0 ? (
                                <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    no asks
                                </div>
                            ) : (
                                topAsks.map((ask, i) => {
                                    const size = parseFloat(ask.size);
                                    const barWidth = (size / maxSize) * 100;
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                padding: 'var(--space-xs) var(--space-sm)',
                                                position: 'relative'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: `${barWidth}%`,
                                                    background: 'rgba(239, 68, 68, 0.15)'
                                                }}
                                            />
                                            <span style={{ position: 'relative', color: 'var(--accent-danger)' }}>
                                                {(parseFloat(ask.price) * 100).toFixed(1)}¢
                                            </span>
                                            <span style={{ position: 'relative', textAlign: 'right' }}>
                                                {size.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    marginTop: 'var(--space-md)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center'
                }}>
                    spread: {orderBook.bids?.[0] && orderBook.asks?.[0]
                        ? `${((parseFloat(orderBook.asks[0].price) - parseFloat(orderBook.bids[0].price)) * 100).toFixed(2)}¢`
                        : 'n/a'
                    }
                </div>
            </div>
        );
    };

    return (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            {/* tabs */}
            <div style={{
                display: 'flex',
                borderBottom: '2px solid var(--border-color)'
            }}>
                <button
                    onClick={() => setActiveTab('chart')}
                    style={{
                        flex: 1,
                        padding: 'var(--space-sm) var(--space-md)',
                        background: activeTab === 'chart' ? 'var(--bg-secondary)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'chart' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.625rem',
                        color: activeTab === 'chart' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        textTransform: 'lowercase'
                    }}
                >
                    📈 price chart
                </button>
                <button
                    onClick={() => setActiveTab('orderbook')}
                    style={{
                        flex: 1,
                        padding: 'var(--space-sm) var(--space-md)',
                        background: activeTab === 'orderbook' ? 'var(--bg-secondary)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'orderbook' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.625rem',
                        color: activeTab === 'orderbook' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        textTransform: 'lowercase'
                    }}
                >
                    📊 order book
                </button>
            </div>

            {/* content */}
            {activeTab === 'chart' ? renderChart() : renderOrderBook()}
        </div>
    );
}
