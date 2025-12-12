import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { polygon } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { ReactNode } from 'react';

const projectId = 'a7516fe433dc609dd8c3ebb84d4c912e';

const metadata = {
    name: 'jolymarket',
    description: 'flexible wallet trading for polymarket',
    url: 'https://www.joly.market',
    icons: ['https://www.joly.market/favicon.png']
};

const networks = [polygon];

const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: false
});

const queryClient = new QueryClient();

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

export const wagmiConfig = wagmiAdapter.wagmiConfig;

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
