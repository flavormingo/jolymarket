// market card component

import { formatVolume, formatTimeRemaining } from '../services/gamma';
import type { ParsedMarket } from '../types';

interface MarketCardProps {
    market: ParsedMarket;
    onClick?: () => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
    const yesPricePercent = Math.round(market.yesPrice * 100);
    const noPricePercent = Math.round(market.noPrice * 100);
    const timeRemaining = formatTimeRemaining(market.endDate);
    const volumeFormatted = formatVolume(market.volume);

    return (
        <article className="market-card" onClick={onClick}>
            <div className="market-card-header">
                {market.image && (
                    <img
                        src={market.image}
                        alt=""
                        className="market-card-image"
                        loading="lazy"
                    />
                )}
                <h3 className="market-card-title">{market.question.toLowerCase()}</h3>
            </div>

            <div className="market-card-prices">
                <div className="market-price">
                    <div className="market-price-label">yes</div>
                    <div className="market-price-value yes">{yesPricePercent}¢</div>
                </div>
                <div className="market-price">
                    <div className="market-price-label">no</div>
                    <div className="market-price-value no">{noPricePercent}¢</div>
                </div>
            </div>

            <div className="pixel-progress">
                <div
                    className="pixel-progress-bar"
                    style={{ width: `${yesPricePercent}%` }}
                />
            </div>

            <div className="market-card-meta" style={{ marginTop: 'var(--space-sm)' }}>
                <span className="market-card-volume">
                    📊 {volumeFormatted}
                </span>
                <span className="market-card-ends">
                    ⏰ {timeRemaining}
                </span>
            </div>

            {market.tags.length > 0 && (
                <div style={{
                    marginTop: 'var(--space-sm)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-xs)'
                }}>
                    {market.tags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            style={{
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            {tag.toLowerCase()}
                        </span>
                    ))}
                </div>
            )}
        </article>
    );
}
