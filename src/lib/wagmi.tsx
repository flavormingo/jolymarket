import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { polygon } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { ReactNode } from 'react';

// walletconnect project id (reown)
const projectId = 'a75feaa4ccaf8e8b1193f2bb0aa7537f';

// metadata for walletconnect
const metadata = {
    name: 'jolymarket',
    description: 'flexible wallet trading for polymarket',
    url: 'https://www.joly.market',
    icons: ['https://www.joly.market/favicon.png']
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
