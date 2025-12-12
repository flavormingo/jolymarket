import { useState } from 'react';
import { useAccount } from 'wagmi';
import type { ParsedMarket } from '../types';

interface TradePanelProps {
    market: ParsedMarket;
    onTrade?: (order: { side: 'BUY' | 'SELL'; outcome: 'yes' | 'no'; amount: number }) => void;
    isTrading?: boolean;
    tradeStatus?: string;
    tradeError?: string | null;
    orderId?: string | null;
}

export function TradePanel({ market, onTrade, isTrading, tradeStatus, tradeError, orderId }: TradePanelProps) {
    const { isConnected } = useAccount();
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [outcome, setOutcome] = useState<'yes' | 'no'>('yes');
    const [amount, setAmount] = useState<string>('');

    const price = outcome === 'yes' ? market.yesPrice : market.noPrice;
    const pricePercent = Math.round(price * 100);

    const amountNum = parseFloat(amount) || 0;
    const shares = amountNum / price;
    const potentialReturn = side === 'BUY' ? shares * (1 - price) : shares * price;

    const handleSubmit = () => {
        if (!onTrade || amountNum <= 0) return;
        onTrade({ side, outcome, amount: amountNum });
    };

    return (
        <div className="trade-panel">
            <h3 className="trade-panel-title">trade</h3>

            
            {isTrading && (
                <div style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-tertiary)',
                    marginBottom: 'var(--space-md)',
                    textAlign: 'center'
                }}>
                    <div className="loading-spinner" style={{ marginBottom: 'var(--space-sm)' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>{tradeStatus || 'processing...'}</p>
                </div>
            )}

            {tradeError && (
                <div style={{
                    padding: 'var(--space-md)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--accent-danger)',
                    marginBottom: 'var(--space-md)',
                    textAlign: 'center'
                }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--accent-danger)' }}>
                        {tradeError}
                    </p>
                </div>
            )}

            {orderId && (
                <div style={{
                    padding: 'var(--space-md)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid var(--accent-success)',
                    marginBottom: 'var(--space-md)',
                    textAlign: 'center'
                }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--accent-success)' }}>
                        ✓ order submitted!
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        id: {orderId.slice(0, 8)}...
                    </p>
                </div>
            )}

            
            <div className="trade-tabs">
                <button
                    className={`trade-tab ${side === 'BUY' ? 'active buy' : ''}`}
                    onClick={() => setSide('BUY')}
                    disabled={isTrading}
                >
                    buy
                </button>
                <button
                    className={`trade-tab ${side === 'SELL' ? 'active sell' : ''}`}
                    onClick={() => setSide('SELL')}
                    disabled={isTrading}
                >
                    sell
                </button>
            </div>

            
            <div className="trade-outcome-buttons">
                <button
                    className={`trade-outcome-btn yes ${outcome === 'yes' ? 'active' : ''}`}
                    onClick={() => setOutcome('yes')}
                    disabled={isTrading}
                >
                    yes {Math.round(market.yesPrice * 100)}¢
                </button>
                <button
                    className={`trade-outcome-btn no ${outcome === 'no' ? 'active' : ''}`}
                    onClick={() => setOutcome('no')}
                    disabled={isTrading}
                >
                    no {Math.round(market.noPrice * 100)}¢
                </button>
            </div>

            
            <div className="trade-amount-input">
                <label className="trade-amount-label">amount (usdc)</label>
                <div className="trade-amount-field">
                    <input
                        type="number"
                        className="input"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        disabled={isTrading}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>usdc</span>
                </div>
            </div>

            
            {amountNum > 0 && (
                <div className="trade-summary">
                    <div className="trade-summary-row">
                        <span>shares</span>
                        <span>{shares.toFixed(2)}</span>
                    </div>
                    <div className="trade-summary-row">
                        <span>avg price</span>
                        <span>{pricePercent}¢</span>
                    </div>
                    <div className="trade-summary-row">
                        <span>potential {side === 'BUY' ? 'profit' : 'return'}</span>
                        <span className={side === 'BUY' ? 'text-success' : ''}>
                            ${potentialReturn.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            
            <button
                className={`btn ${side === 'BUY' ? 'btn-success' : 'btn-danger'} trade-submit-btn btn-lg`}
                onClick={handleSubmit}
                disabled={!isConnected || amountNum <= 0 || isTrading}
            >
                {isTrading
                    ? 'processing...'
                    : !isConnected
                        ? 'connect wallet to trade'
                        : amountNum <= 0
                            ? 'enter amount'
                            : `${side.toLowerCase()} ${outcome} shares`
                }
            </button>

            {!isConnected && (
                <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginTop: 'var(--space-sm)'
                }}>
                    connect your wallet to start trading
                </p>
            )}
        </div>
    );
}

