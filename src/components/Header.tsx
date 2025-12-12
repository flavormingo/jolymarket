import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useDisconnect } from 'wagmi';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
    const { open } = useAppKit();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { isDark, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleWalletClick = () => {
        if (isConnected) {
            setWalletModalOpen(true);
        } else {
            open();
        }
        setMobileMenuOpen(false);
    };

    const handleCopyAddress = async () => {
        if (address) {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setWalletModalOpen(false);
    };

    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
    };

    const handleNavClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <>
            <header className="header">
                <div className="header-logo">
                    <a href="/">jolymarket</a>
                </div>

                
                <nav className="header-nav desktop-only">
                    <Link
                        to="/"
                        className={`header-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        markets
                    </Link>
                    <Link
                        to="/portfolio"
                        className={`header-nav-link ${location.pathname === '/portfolio' ? 'active' : ''}`}
                    >
                        portfolio
                    </Link>
                    <Link
                        to="/info"
                        className={`header-nav-link ${location.pathname === '/info' ? 'active' : ''}`}
                    >
                        info
                    </Link>
                </nav>

                
                <div className="header-actions desktop-only">
                    <button
                        className={`btn ${isConnected ? 'btn-success' : 'btn-primary'} wallet-btn`}
                        onClick={handleWalletClick}
                    >
                        {isConnected ? (
                            <>
                                <span className="wallet-address">{formatAddress(address!)}</span>
                            </>
                        ) : (
                            'connect wallet'
                        )}
                    </button>

                    <button className="btn" onClick={logout}>
                        logout
                    </button>

                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label="toggle theme"
                    >
                        <span className="theme-toggle-slider">
                            {isDark ? '🌝' : '🌞'}
                        </span>
                    </button>
                </div>

                
                <button
                    className="btn mobile-menu-btn mobile-only"
                    onClick={() => setMobileMenuOpen(true)}
                >
                    menu
                </button>
            </header>

            
            {mobileMenuOpen && (
                <div className="modal-overlay" onClick={() => setMobileMenuOpen(false)}>
                    <div className="modal mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">menu</h2>
                            <button
                                className="modal-close"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <Link
                                to="/"
                                className={`btn ${location.pathname === '/' ? 'btn-primary' : ''}`}
                                onClick={handleNavClick}
                                style={{ width: '100%', textAlign: 'center' }}
                            >
                                markets
                            </Link>

                            <Link
                                to="/portfolio"
                                className={`btn ${location.pathname === '/portfolio' ? 'btn-primary' : ''}`}
                                onClick={handleNavClick}
                                style={{ width: '100%', textAlign: 'center' }}
                            >
                                portfolio
                            </Link>

                            <Link
                                to="/info"
                                className={`btn ${location.pathname === '/info' ? 'btn-primary' : ''}`}
                                onClick={handleNavClick}
                                style={{ width: '100%', textAlign: 'center' }}
                            >
                                info
                            </Link>

                            <button
                                className={`btn ${isConnected ? 'btn-success' : 'btn-primary'}`}
                                onClick={handleWalletClick}
                                style={{ width: '100%' }}
                            >
                                {isConnected ? formatAddress(address!) : 'connect wallet'}
                            </button>

                            <button
                                className="btn"
                                onClick={handleLogout}
                                style={{ width: '100%' }}
                            >
                                logout
                            </button>

                            <button
                                className="theme-toggle"
                                onClick={toggleTheme}
                                aria-label="toggle theme"
                                style={{ margin: '0 auto' }}
                            >
                                <span className="theme-toggle-slider">
                                    {isDark ? '🌝' : '🌞'}
                                </span>
                            </button>

                            <div className="mobile-menu-footer">
                                made with love by{' '}
                                <a href="https://zany.digital" target="_blank" rel="noopener noreferrer">
                                    zany.digital
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            
            {walletModalOpen && (
                <div className="modal-overlay" onClick={() => setWalletModalOpen(false)}>
                    <div className="modal wallet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">wallet</h2>
                            <button
                                className="modal-close"
                                onClick={() => setWalletModalOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div style={{
                                background: 'var(--bg-tertiary)',
                                padding: 'var(--space-md)',
                                marginBottom: 'var(--space-md)',
                                wordBreak: 'break-all',
                                fontSize: '0.875rem'
                            }}>
                                {address}
                            </div>

                            <button
                                className="btn"
                                onClick={handleCopyAddress}
                                style={{ width: '100%', marginBottom: 'var(--space-sm)' }}
                            >
                                {copied ? '✓ copied!' : 'copy address'}
                            </button>

                            <button
                                className="btn btn-danger"
                                onClick={handleDisconnect}
                                style={{ width: '100%' }}
                            >
                                disconnect wallet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
