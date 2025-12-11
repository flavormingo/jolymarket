// market detail page

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventBySlug, parseMarket, formatVolume, formatTimeRemaining } from '../services/gamma';
import { TradePanel } from '../components/TradePanel';
import { PriceChartOrderBook } from '../components/PriceChartOrderBook';
import type { ParsedMarket } from '../types';

export function MarketDetailPage() {
    const { slug, marketId } = useParams<{ slug: string; marketId?: string }>();
    const navigate = useNavigate();
    const [market, setMarket] = useState<ParsedMarket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        const loadMarket = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const event = await fetchEventBySlug(slug);
                if (event && event.markets && event.markets.length > 0) {
                    // find the specific market by ID, or use first market as fallback
                    let targetMarket = event.markets[0];
                    if (marketId) {
                        const found = event.markets.find(m => m.id === marketId);
                        if (found) {
                            targetMarket = found;
                        }
                    }
                    // pass event volume and event slug
                    setMarket(parseMarket(targetMarket, event.volume, event.slug));
                } else {
                    setError('market not found');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'failed to load market');
            } finally {
                setIsLoading(false);
            }
        };

        loadMarket();
    }, [slug, marketId]);

    const handleTrade = async (order: { side: 'BUY' | 'SELL'; outcome: 'yes' | 'no'; amount: number }) => {
        // trading logic would go here
        console.log('trade:', order);
        alert(`trading coming soon!\n\norder: ${order.side} ${order.amount} usdc of ${order.outcome}`);
    };

    if (isLoading) {
        return (
            <div className="main-content" style={{ marginLeft: 0 }}>
                <div className="loading">
                    <div className="loading-spinner" />
                    <span>loading market...</span>
                </div>
            </div>
        );
    }

    if (error || !market) {
        return (
            <div className="main-content" style={{ marginLeft: 0 }}>
                <div className="empty-state">
                    <div className="empty-state-icon">:(</div>
                    <h3 className="empty-state-title">market not found</h3>
                    <p className="empty-state-text">{error}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/')}
                        style={{ marginTop: 'var(--space-md)' }}
                    >
                        back to markets
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content" style={{ marginLeft: 0 }}>
            <button
                className="btn btn-sm"
                onClick={() => navigate('/')}
                style={{ marginBottom: 'var(--space-lg)' }}
            >
                ← back to markets
            </button>

            <div className="market-detail-layout">
                {/* market details */}
                <div className="market-detail-main">
                    <div className="card" style={{ marginBottom: 'var(--space-lg)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                            {market.image && (
                                <img
                                    src={market.image}
                                    alt=""
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        border: '3px solid var(--border-color)',
                                        objectFit: 'cover',
                                        flexShrink: 0
                                    }}
                                />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h1 style={{ marginBottom: 'var(--space-sm)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    {market.question.toLowerCase()}
                                </h1>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 'var(--space-sm)',
                                    fontSize: '1rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    <span>📊 {formatVolume(market.volume)} volume</span>
                                    <span>⏰ ends {formatTimeRemaining(market.endDate)}</span>
                                </div>
                            </div>
                        </div>

                        {market.description && (
                            <p style={{
                                fontSize: '1rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6
                            }}>
                                {market.description.toLowerCase()}
                            </p>
                        )}
                    </div>

                    {/* price chart and order book tabs */}
                    <PriceChartOrderBook market={market} />

                    {/* market info */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-md)' }}>market info</h3>

                        <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>volume</span>
                                <span>{formatVolume(market.volume)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>liquidity</span>
                                <span>{formatVolume(market.liquidity)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>end date</span>
                                <span>{market.endDate.toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>status</span>
                                <span style={{
                                    color: market.active ? 'var(--accent-success)' : 'var(--accent-danger)'
                                }}>
                                    {market.active ? 'active' : 'closed'}
                                </span>
                            </div>
                        </div>

                        {market.tags.length > 0 && (
                            <div style={{ marginTop: 'var(--space-md)' }}>
                                <span style={{
                                    color: 'var(--text-muted)',
                                    display: 'block',
                                    marginBottom: 'var(--space-xs)'
                                }}>
                                    tags
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                                    {market.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                fontSize: '0.875rem',
                                                padding: '4px 8px',
                                                background: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        >
                                            {tag.toLowerCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* trading panel */}
                <div className="market-detail-trade">
                    <TradePanel market={market} onTrade={handleTrade} />
                </div>
            </div>

            <div className="page-footer">
                made with love by{' '}
                <a href="https://zany.digital" target="_blank" rel="noopener noreferrer">
                    zany.digital
                </a>
            </div>
        </div>
    );
}
