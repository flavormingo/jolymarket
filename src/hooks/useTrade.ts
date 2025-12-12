// trading hook - manages trading state and executes orders
// handles credential derivation, USDC approval, and order submission

import { useState, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import {
    deriveApiCredentials,
    createAndPostOrder,
    checkUsdcAllowance,
    approveUsdc
} from '../services/clob';

interface TradeState {
    isLoading: boolean;
    status: string;
    error: string | null;
    txHash: string | null;
    orderId: string | null;
}

interface TradeParams {
    tokenId: string;
    price: number;
    size: number;
    side: 'BUY' | 'SELL';
}

// cache credentials in memory for session
let cachedCredentials: { apiKey: string; secret: string; passphrase: string } | null = null;

export function useTrade() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [state, setState] = useState<TradeState>({
        isLoading: false,
        status: '',
        error: null,
        txHash: null,
        orderId: null
    });

    // prevent double-clicks
    const isExecuting = useRef(false);

    const executeTrade = useCallback(async (params: TradeParams): Promise<boolean> => {
        if (!isConnected || !walletClient || !address) {
            setState(s => ({ ...s, error: 'wallet not connected' }));
            return false;
        }

        if (isExecuting.current) {
            return false;
        }

        isExecuting.current = true;
        setState({
            isLoading: true,
            status: 'preparing trade...',
            error: null,
            txHash: null,
            orderId: null
        });

        try {
            // convert viem wallet client to ethers signer
            const provider = new ethers.providers.Web3Provider(
                walletClient.transport as unknown as ethers.providers.ExternalProvider
            );
            const signer = provider.getSigner();

            // step 1: get or derive credentials
            setState(s => ({ ...s, status: 'deriving credentials...' }));
            let credentials = cachedCredentials;
            if (!credentials) {
                credentials = await deriveApiCredentials(signer);
                cachedCredentials = credentials;
            }

            // step 2: check usdc allowance
            setState(s => ({ ...s, status: 'checking usdc approval...' }));
            const hasAllowance = await checkUsdcAllowance(provider, address);

            if (!hasAllowance) {
                setState(s => ({ ...s, status: 'requesting usdc approval...' }));
                const approveTxHash = await approveUsdc(signer);
                setState(s => ({ ...s, txHash: approveTxHash, status: 'usdc approved, submitting order...' }));
            }

            // step 3: submit order
            setState(s => ({ ...s, status: 'signing and submitting order...' }));
            const result = await createAndPostOrder(signer, credentials, params);

            if (result.errorMsg) {
                throw new Error(result.errorMsg);
            }

            setState({
                isLoading: false,
                status: 'order submitted!',
                error: null,
                txHash: null,
                orderId: result.orderID
            });

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'unknown error';
            console.error('trade failed:', error);
            setState({
                isLoading: false,
                status: '',
                error: errorMessage,
                txHash: null,
                orderId: null
            });
            return false;
        } finally {
            isExecuting.current = false;
        }
    }, [isConnected, walletClient, address]);

    const reset = useCallback(() => {
        setState({
            isLoading: false,
            status: '',
            error: null,
            txHash: null,
            orderId: null
        });
    }, []);

    return {
        ...state,
        executeTrade,
        reset
    };
}
