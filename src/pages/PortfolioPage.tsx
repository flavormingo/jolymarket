// portfolio page - user positions and trades

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Sidebar } from '../components/Sidebar';
import type { Category, SortOption } from '../types';

interface Position {
    id: string;
    market: string;
    outcome: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    value: number;
    pnl: number;
    pnlPercent: number;
}

export function PortfolioPage() {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const [positions, setPositions] = useState<Position[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // read filter preferences from localStorage to stay in sync
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

    // jolyMode state - read from localStorage for consistency
    const [jolyMode, setJolyMode] = useState<boolean>(() => {
        try {
            return localStorage.getItem('jolymarket_jolymode') === 'true';
        } catch {
            return false;
        }
    });

    // placeholder - would fetch from clob api
    useEffect(() => {
        if (isConnected && address) {
            setIsLoading(true);
            // simulated loading
            setTimeout(() => {
                setPositions([]);
                setIsLoading(false);
            }, 500);
        }
    }, [isConnected, address]);

    // navigate to markets page when sidebar filters are clicked
    const handleCategoryChange = (cat: Category) => {
        setCategoryState(cat);
        try { localStorage.setItem('jolymarket_category', cat); } catch { }
        navigate(`/?category=${cat}`);
    };

    const handleSortChange = (s: SortOption) => {
        setSortState(s);
        try { localStorage.setItem('jolymarket_sort', s); } catch { }
        navigate(`/?sort=${s}`);
    };

    const handleJolyModeChange = (enabled: boolean) => {
        setJolyMode(enabled);
        try {
            localStorage.setItem('jolymarket_jolymode', enabled.toString());
        } catch {
            // ignore
        }
    };

    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);

    return (
        <div className="app-layout">
            {/* desktop sidebar */}
            <div className="desktop-only">
                <Sidebar
                    category={category}
                    sort={sort}
                    jolyMode={jolyMode}
                    onCategoryChange={handleCategoryChange}
                    onSortChange={handleSortChange}
                    onJolyModeChange={handleJolyModeChange}
                />
            </div>

            <main className="main-content">
                <h1 style={{ marginBottom: 'var(--space-lg)' }}>portfolio</h1>

                {!isConnected ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">:(</div>
                        <h3 className="empty-state-title">wallet not connected</h3>
                        <p className="empty-state-text">
                            connect your wallet to view your portfolio
                        </p>
                    </div>
                ) : (
                    <>
                        {/* overview cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 'var(--space-md)',
                            marginBottom: 'var(--space-xl)'
                        }}>
                            <div className="card">
                                <div className="card-header">total value</div>
                                <div style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1rem',
                                    color: 'var(--accent-primary)'
                                }}>
                                    ${totalValue.toFixed(2)}
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">total p&l</div>
                                <div style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '1rem',
                                    color: totalPnl >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
                                }}>
                                    {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">wallet</div>
                                <div style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)',
                                    wordBreak: 'break-all'
                                }}>
                                    {address}
                                </div>
                            </div>
                        </div>

                        {/* positions section */}
                        <section className="portfolio-section">
                            <h2 className="portfolio-section-title">positions</h2>

                            {isLoading ? (
                                <div className="loading">
                                    <div className="loading-spinner" />
                                    <span>loading positions...</span>
                                </div>
                            ) : positions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📊</div>
                                    <h3 className="empty-state-title">no positions yet</h3>
                                    <p className="empty-state-text">
                                        start trading to build your portfolio
                                    </p>
                                </div>
                            ) : (
                                <table className="positions-table">
                                    <thead>
                                        <tr>
                                            <th>market</th>
                                            <th>outcome</th>
                                            <th>shares</th>
                                            <th>avg price</th>
                                            <th>current</th>
                                            <th>value</th>
                                            <th>p&l</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positions.map((pos) => (
                                            <tr key={pos.id}>
                                                <td>{pos.market}</td>
                                                <td>{pos.outcome}</td>
                                                <td>{pos.shares.toFixed(2)}</td>
                                                <td>{(pos.avgPrice * 100).toFixed(0)}¢</td>
                                                <td>{(pos.currentPrice * 100).toFixed(0)}¢</td>
                                                <td>${pos.value.toFixed(2)}</td>
                                                <td className={pos.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                                                    {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(1)}%)
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>

                        {/* open orders section */}
                        <section className="portfolio-section">
                            <h2 className="portfolio-section-title">open orders</h2>
                            <div className="empty-state">
                                <div className="empty-state-icon">📝</div>
                                <h3 className="empty-state-title">no open orders</h3>
                                <p className="empty-state-text">
                                    your pending orders will appear here
                                </p>
                            </div>
                        </section>

                        {/* trade history section */}
                        <section className="portfolio-section">
                            <h2 className="portfolio-section-title">trade history</h2>
                            <div className="empty-state">
                                <div className="empty-state-icon">📜</div>
                                <h3 className="empty-state-title">no trades yet</h3>
                                <p className="empty-state-text">
                                    your completed trades will appear here
                                </p>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
