import { Link } from 'react-router-dom';

export function InfoPage() {
    return (
        <div className="main-content" style={{ marginLeft: 0 }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: 'var(--space-xl)' }}>about jolymarket</h1>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>🧠 smarter bets, not harder bets</h3>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        jolymarket isn't just another prediction market interface. we're building
                        a curated experience focused on <strong>high-confidence opportunities</strong> -
                        markets where the outcome is nearly certain, giving you safer ways to grow your portfolio.
                    </p>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>🎯 jolymode - your safe bets filter</h3>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <p style={{ marginBottom: 'var(--space-md)' }}>
                            toggle <strong>jolymode</strong> in the sidebar to instantly filter for
                            high-confidence opportunities. when enabled, you'll only see markets that meet
                            all three criteria:
                        </p>
                        <p style={{ marginBottom: 'var(--space-md)' }}>
                            <strong>90%+ confidence</strong><br />
                            YES or NO trading at 90¢ or higher - near-certain outcomes.
                        </p>
                        <p style={{ marginBottom: 'var(--space-md)' }}>
                            <strong>$10k+ liquidity</strong><br />
                            deep markets with smooth execution and fair prices.
                        </p>
                        <p>
                            <strong>ending within 30 days</strong><br />
                            faster resolution means quicker payouts - no waiting months.
                        </p>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>💸 how it works</h3>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <p style={{ marginBottom: 'var(--space-md)' }}>
                            <strong>1. connect your wallet</strong><br />
                            use metamask, rainbow, or any walletconnect-compatible wallet on polygon.
                        </p>
                        <p style={{ marginBottom: 'var(--space-md)' }}>
                            <strong>2. find your opportunity</strong><br />
                            browse our curated selection of high-confidence markets across crypto,
                            politics, sports and more.
                        </p>
                        <p style={{ marginBottom: 'var(--space-md)' }}>
                            <strong>3. make your move</strong><br />
                            buy shares in the outcome you believe in. each winning share pays out $1.
                        </p>
                        <p>
                            <strong>4. collect your winnings</strong><br />
                            when the market resolves, your winning shares are automatically redeemable.
                        </p>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>⚡ powered by polymarket</h3>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
                        jolymarket connects to{' '}
                        <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer">
                            polymarket
                        </a>
                        's decentralized prediction market protocol - the largest and most liquid
                        prediction market on the blockchain.
                    </p>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        all trades are executed on-chain on polygon, ensuring fast, low-cost
                        transactions with full transparency.
                    </p>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'var(--bg-tertiary)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-muted)' }}>⚠️ disclaimer</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        jolymarket is an independent interface and is not affiliated with polymarket.
                        prediction markets involve financial risk - even "high-confidence" markets can
                        resolve unexpectedly. only trade with funds you can afford to lose.
                        past performance does not guarantee future results. always do your own research.
                    </p>
                </div>

                <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
                    <Link to="/" className="btn btn-primary">
                        start trading →
                    </Link>
                </div>

                <div className="page-footer">
                    made with love by{' '}
                    <a href="https://zany.digital" target="_blank" rel="noopener noreferrer">
                        zany.digital
                    </a>
                </div>
            </div>
        </div>
    );
}
