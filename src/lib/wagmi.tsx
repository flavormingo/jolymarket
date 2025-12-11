import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { polygon } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { ReactNode } from 'react';

// walletconnect project id
const projectId = '3eaa93a51eeedfed3aadf1b9bef902e1';

// metadata for walletconnect - use current origin in dev
const metadata = {
    name: 'jolymarket',
    description: 'trade on polymarket with an 8-bit twist',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://jolymarket.app',
    icons: [typeof window !== 'undefined' ? `${window.location.origin}/icon.svg` : 'https://jolymarket.app/icon.png']
};

// supported networks - polygon for polymarket
const networks = [polygon];

// create wagmi adapter
const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: false
});

// create query client
const queryClient = new QueryClient();

// create appkit modal
createAppKit({
    adapters: [wagmiAdapter],
    networks: [polygon] as const,
    projectId,
    metadata,
    features: {
        analytics: false,
        email: false,
        socials: false
    },
    themeMode: 'light',
    themeVariables: {
        '--w3m-font-family': 'VT323, monospace',
        '--w3m-accent': '#6366f1',
        '--w3m-border-radius-master': '0px'
    }
});

// export config for wagmi hooks
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// provider component
interface Web3ProviderProps {
    children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
