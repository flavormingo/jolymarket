// markets page - main view

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMarkets } from '../hooks/useMarkets';
import { Sidebar } from '../components/Sidebar';
import { MarketCard } from '../components/MarketCard';
import type { Category, SortOption } from '../types';

export function MarketsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        markets,
        isLoading,
        error,
        hasMore,
        category,
        sort,
        jolyMode,
        setCategory,
        setSort,
        setJolyMode,
        loadMore
    } = useMarkets();

    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // apply query params from URL on mount
    useEffect(() => {
        const urlCategory = searchParams.get('category') as Category | null;
        const urlSort = searchParams.get('sort') as SortOption | null;

        if (urlCategory) {
            setCategory(urlCategory);
        }
        if (urlSort) {
            setSort(urlSort);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // filter markets by search
    const filteredMarkets = searchQuery
        ? markets.filter(m =>
            m.question.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : markets;

    const handleCategoryChange = (cat: Category) => {
        setCategory(cat);
        setSidebarOpen(false);
    };

    const handleSortChange = (s: SortOption) => {
        setSort(s);
        setSidebarOpen(false);
    };

    return (
        <div className="app-layout">
            {/* desktop sidebar */}
            <div className="desktop-only">
                <Sidebar
                    category={category}
                    sort={sort}
                    jolyMode={jolyMode}
                    onCategoryChange={setCategory}
                    onSortChange={setSort}
                    onJolyModeChange={setJolyMode}
                />
            </div>

            {/* mobile sidebar modal */}
            {sidebarOpen && (
                <div className="modal-overlay" onClick={() => setSidebarOpen(false)}>
                    <div className="modal mobile-sidebar-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">sort / filter</h2>
                            <button
                                className="modal-close"
                                onClick={() => setSidebarOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <Sidebar
                                category={category}
                                sort={sort}
                                jolyMode={jolyMode}
                                onCategoryChange={handleCategoryChange}
                                onSortChange={handleSortChange}
                                onJolyModeChange={setJolyMode}
                                inModal
                            />
                        </div>
                    </div>
                </div>
            )}

            <main className="main-content">
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <h1 style={{ marginBottom: 'var(--space-md)' }}>markets</h1>

                    <input
                        type="search"
                        className="input"
                        placeholder="search markets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%' }}
                    />

                    {/* mobile filter button */}
                    <button
                        className="btn mobile-only mobile-filter-btn"
                        onClick={() => setSidebarOpen(true)}
                        style={{ marginTop: 'var(--space-md)', width: '100%' }}
                    >
                        sort / filter
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: 'var(--space-md)',
                        background: 'var(--accent-danger)',
                        color: 'white',
                        marginBottom: 'var(--space-lg)'
                    }}>
                        error: {error}
                    </div>
                )}

                {isLoading && markets.length === 0 ? (
                    <div className="loading">
                        <div className="loading-spinner" />
                        <span>loading markets...</span>
                    </div>
                ) : filteredMarkets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">:(</div>
                        <h3 className="empty-state-title">no markets found</h3>
                        <p className="empty-state-text">
                            try adjusting your filters or search
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="markets-grid">
                            {filteredMarkets.map((market) => (
                                <MarketCard
                                    key={market.id}
                                    market={market}
                                    onClick={() => navigate(`/market/${market.eventSlug}/${market.id}`)}
                                />
                            ))}
                        </div>

                        {hasMore && !searchQuery && (
                            <div style={{
                                textAlign: 'center',
                                marginTop: 'var(--space-xl)'
                            }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={loadMore}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'loading...' : 'load more'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
