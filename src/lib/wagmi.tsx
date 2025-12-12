import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect } from 'wagmi/connectors';
import type { ReactNode } from 'react';

const projectId = 'a7516fe433dc609dd8c3ebb84d4c912e';

export const wagmiConfig = createConfig({
    chains: [polygon],
    connectors: [
        injected({
            shimDisconnect: true,
        }),
        walletConnect({
            projectId,
            metadata: {
                name: 'jolymarket',
                description: 'flexible wallet trading for polymarket',
                url: 'https://www.joly.market',
                icons: ['https://www.joly.market/favicon.png']
            },
            showQrModal: false,
        }),
    ],
    transports: {
        [polygon.id]: http(),
    },
});

const queryClient = new QueryClient();

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
