import { useState, useEffect } from 'react';
import { useConnect, useAccount, useDisconnect, type Connector } from 'wagmi';
import { QRCodeSVG } from 'qrcode.react';

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WALLET_ICONS: Record<string, string> = {
    'metamask': '🦊',
    'coinbase wallet': '💰',
    'phantom': '👻',
    'trust wallet': '🛡️',
    'rainbow': '🌈',
    'brave wallet': '🦁',
    'injected': '💼',
    'walletconnect': '🔗',
};

function getWalletIcon(name: string): string {
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(WALLET_ICONS)) {
        if (lowerName.includes(key)) return icon;
    }
    return '💼';
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { connectors, connect, isPending, error } = useConnect();
    const { isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [wcUri, setWcUri] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);
    const [connectingTo, setConnectingTo] = useState<string | null>(null);

    useEffect(() => {
        if (isConnected && isOpen) {
            onClose();
        }
    }, [isConnected, isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setShowQR(false);
            setWcUri(null);
            setConnectingTo(null);
        }
    }, [isOpen]);

    const handleConnect = async (connector: Connector) => {
        setConnectingTo(connector.name);

        if (connector.id === 'walletConnect') {
            setShowQR(true);

            const provider = await connector.getProvider();

            if (provider && typeof provider === 'object' && provider !== null && 'on' in provider) {
                (provider as { on: (event: string, callback: (uri: string) => void) => void }).on('display_uri', (uri: string) => {
                    setWcUri(uri);
                });
            }
        }

        connect({ connector }, {
            onSuccess: () => {
                onClose();
            },
            onError: () => {
                setShowQR(false);
                setWcUri(null);
                setConnectingTo(null);
            }
        });
    };

    const handleBack = () => {
        setShowQR(false);
        setWcUri(null);
        setConnectingTo(null);
    };

    if (!isOpen) return null;

    const injectedConnectors = connectors.filter(c => c.id !== 'walletConnect');
    const wcConnector = connectors.find(c => c.id === 'walletConnect');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal wallet-connect-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    {showQR && (
                        <button className="modal-back" onClick={handleBack}>
                            ←
                        </button>
                    )}
                    <h2 className="modal-title">
                        {showQR ? 'scan with wallet' : 'connect wallet'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="wallet-error">
                            {error.message.includes('rejected')
                                ? 'connection rejected'
                                : 'connection failed'}
                        </div>
                    )}

                    {showQR ? (
                        <div className="wallet-qr-container">
                            {wcUri ? (
                                <>
                                    <div className="wallet-qr-code">
                                        <QRCodeSVG
                                            value={wcUri}
                                            size={200}
                                            bgColor="var(--bg-primary)"
                                            fgColor="var(--text-primary)"
                                            level="M"
                                        />
                                    </div>
                                    <p className="wallet-qr-hint">
                                        scan this code with your mobile wallet
                                    </p>
                                </>
                            ) : (
                                <div className="loading">
                                    <div className="loading-spinner" />
                                    <span>generating qr code...</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="wallet-list">
                            {injectedConnectors.length > 0 && (
                                <>
                                    <p className="wallet-section-label">detected wallets</p>
                                    {injectedConnectors.map((connector) => (
                                        <button
                                            key={connector.uid}
                                            className="wallet-option"
                                            onClick={() => handleConnect(connector)}
                                            disabled={isPending}
                                        >
                                            <span className="wallet-icon">
                                                {getWalletIcon(connector.name)}
                                            </span>
                                            <span className="wallet-name">
                                                {connector.name.toLowerCase()}
                                            </span>
                                            {isPending && connectingTo === connector.name && (
                                                <span className="wallet-status">connecting...</span>
                                            )}
                                        </button>
                                    ))}
                                </>
                            )}

                            {wcConnector && (
                                <>
                                    <p className="wallet-section-label">mobile wallets</p>
                                    <button
                                        className="wallet-option"
                                        onClick={() => handleConnect(wcConnector)}
                                        disabled={isPending}
                                    >
                                        <span className="wallet-icon">📱</span>
                                        <span className="wallet-name">walletconnect</span>
                                        <span className="wallet-arrow">→</span>
                                    </button>
                                </>
                            )}

                            {injectedConnectors.length === 0 && (
                                <p className="wallet-no-wallets">
                                    no browser wallets detected. try walletconnect for mobile.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {isConnected && (
                    <div className="modal-footer">
                        <button
                            className="btn btn-danger"
                            onClick={() => disconnect()}
                            style={{ width: '100%' }}
                        >
                            disconnect
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
