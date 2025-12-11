// trading panel component

import { useState } from 'react';
import { useAccount } from 'wagmi';
import type { ParsedMarket } from '../types';

interface TradePanelProps {
    market: ParsedMarket;
    onTrade?: (order: { side: 'BUY' | 'SELL'; outcome: 'yes' | 'no'; amount: number }) => void;
}

export function TradePanel({ market, onTrade }: TradePanelProps) {
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

            {/* buy/sell tabs */}
            <div className="trade-tabs">
                <button
                    className={`trade-tab ${side === 'BUY' ? 'active buy' : ''}`}
                    onClick={() => setSide('BUY')}
                >
                    buy
                </button>
                <button
                    className={`trade-tab ${side === 'SELL' ? 'active sell' : ''}`}
                    onClick={() => setSide('SELL')}
                >
                    sell
                </button>
            </div>

            {/* outcome selection */}
            <div className="trade-outcome-buttons">
                <button
                    className={`trade-outcome-btn yes ${outcome === 'yes' ? 'active' : ''}`}
                    onClick={() => setOutcome('yes')}
                >
                    yes {Math.round(market.yesPrice * 100)}¢
                </button>
                <button
                    className={`trade-outcome-btn no ${outcome === 'no' ? 'active' : ''}`}
                    onClick={() => setOutcome('no')}
                >
                    no {Math.round(market.noPrice * 100)}¢
                </button>
            </div>

            {/* amount input */}
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
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>usdc</span>
                </div>
            </div>

            {/* order summary */}
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

            {/* submit button */}
            <button
                className={`btn ${side === 'BUY' ? 'btn-success' : 'btn-danger'} trade-submit-btn btn-lg`}
                onClick={handleSubmit}
                disabled={!isConnected || amountNum <= 0}
            >
                {!isConnected
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
