import { useState } from 'react';
import type { Category, SortOption } from '../types';

interface SidebarProps {
    category: Category;
    sort: SortOption;
    jolyMode: boolean;
    onCategoryChange: (category: Category) => void;
    onSortChange: (sort: SortOption) => void;
    onJolyModeChange: (enabled: boolean) => void;
    inModal?: boolean; // when true, use modal-friendly styling
}

const CATEGORIES: { value: Category; label: string }[] = [
    { value: 'all', label: 'all' },
    { value: 'crypto', label: 'crypto' },
    { value: 'culture', label: 'culture' },
    { value: 'earnings', label: 'earnings' },
    { value: 'economy', label: 'economy' },
    { value: 'elections', label: 'elections' },
    { value: 'finance', label: 'finance' },
    { value: 'geopolitics', label: 'geopolitics' },
    { value: 'politics', label: 'politics' },
    { value: 'sports', label: 'sports' },
    { value: 'tech', label: 'tech' },
    { value: 'world', label: 'world' }
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'new', label: 'new' },
    { value: 'trending', label: 'trending' },
    { value: 'ending-soon', label: 'ending soon' }
];

export function Sidebar({
    category,
    sort,
    jolyMode,
    onCategoryChange,
    onSortChange,
    onJolyModeChange,
    inModal
}: SidebarProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <aside className={inModal ? 'sidebar-modal-content' : 'sidebar'}>
            <section className="sidebar-section">
                <h3 className="sidebar-title">categories</h3>
                <ul className="sidebar-list">
                    {CATEGORIES.map((cat) => (
                        <li key={cat.value}>
                            <button
                                className={`sidebar-item ${category === cat.value ? 'active' : ''}`}
                                onClick={() => onCategoryChange(cat.value)}
                            >
                                {cat.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="sidebar-section">
                <h3 className="sidebar-title">sort by</h3>
                <ul className="sidebar-list">
                    {SORT_OPTIONS.map((opt) => (
                        <li key={opt.value}>
                            <button
                                className={`sidebar-item ${sort === opt.value ? 'active' : ''}`}
                                onClick={() => onSortChange(opt.value)}
                            >
                                {opt.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            
            <section className="sidebar-section">
                <div className="jolymode-header">
                    <h3 className="sidebar-title" style={{ marginBottom: 0 }}>
                        jolymode
                        <button
                            className="jolymode-info-btn"
                            onClick={() => setShowTooltip(!showTooltip)}
                            aria-label="What is JolyMode?"
                        >
                            ?
                        </button>
                    </h3>
                    <button
                        className={`jolymode-toggle ${jolyMode ? 'active' : ''}`}
                        onClick={() => onJolyModeChange(!jolyMode)}
                        aria-label="Toggle JolyMode"
                    >
                        <span className="jolymode-toggle-slider">
                            {jolyMode ? '😼' : '🐱'}
                        </span>
                    </button>
                </div>

                {showTooltip && (
                    <div className="jolymode-tooltip">
                        <strong>🎯 safe bets filter</strong>
                        <p>shows only markets with:</p>
                        <p>» 90%+ confidence</p>
                        <p>» $10k+ liquidity</p>
                        <p>» ending within 30 days</p>
                    </div>
                )}
            </section>

            {!inModal && (
                <div className="sidebar-footer">
                    made with love by{' '}
                    <a href="https://zany.digital" target="_blank" rel="noopener noreferrer">
                        zany.digital
                    </a>
                </div>
            )}
        </aside>
    );
}
