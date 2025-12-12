// trading hook - manages trading state and executes orders
// v2: using official @polymarket/clob-client SDK

import { useState, useCallback, useRef } from 'react';
import { useAccount, useWalletClient, useSwitchChain, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { initializeClobClient, executeSdkTrade, clearClobClient } from '../services/clobSdk';
import { checkUsdcAllowance, approveUsdc } from '../services/clob';

// polygon chain id
const POLYGON_CHAIN_ID = 137;

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

export function useTrade() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();
    const { switchChainAsync } = useSwitchChain();

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
            // step 0: ensure we're on polygon
            if (chainId !== POLYGON_CHAIN_ID) {
                setState(s => ({ ...s, status: 'switching to polygon network...' }));
                await switchChainAsync({ chainId: POLYGON_CHAIN_ID });
            }

            // convert viem wallet client to ethers signer
            const provider = new ethers.providers.Web3Provider(
                walletClient.transport as unknown as ethers.providers.ExternalProvider
            );
            const signer = provider.getSigner();

            // step 1: initialize sdk client (derives credentials internally)
            setState(s => ({ ...s, status: 'initializing trading client...' }));
            const clobClient = await initializeClobClient(signer);

            // step 2: check usdc allowance
            setState(s => ({ ...s, status: 'checking usdc approval...' }));
            const hasAllowance = await checkUsdcAllowance(provider, address);

            if (!hasAllowance) {
                setState(s => ({ ...s, status: 'requesting usdc approval...' }));
                const approveTxHash = await approveUsdc(signer);
                setState(s => ({ ...s, txHash: approveTxHash, status: 'usdc approved, submitting order...' }));
            }

            // step 3: submit order using SDK
            setState(s => ({ ...s, status: 'signing and submitting order...' }));
            const result = await executeSdkTrade(clobClient, params);

            if (!result.success) {
                throw new Error(result.errorMsg || 'Order failed');
            }

            setState({
                isLoading: false,
                status: 'order submitted!',
                error: null,
                txHash: null,
                orderId: result.orderID || null
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
    }, [isConnected, walletClient, address, chainId, switchChainAsync]);

    const reset = useCallback(() => {
        setState({
            isLoading: false,
            status: '',
            error: null,
            txHash: null,
            orderId: null
        });
    }, []);

    // clear client on disconnect
    const logout = useCallback(() => {
        clearClobClient();
        reset();
    }, [reset]);

    return {
        ...state,
        executeTrade,
        reset,
        logout
    };
}
