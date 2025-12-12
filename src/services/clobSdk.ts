// trading service using official @polymarket/clob-client SDK
// this might handle auth/api differently and bypass cloudflare blocking

import { ClobClient, OrderType, Side } from '@polymarket/clob-client';
import { ethers } from 'ethers';

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // polygon
const SIGNATURE_TYPE = 0; // 0 = browser wallet (metamask)

// cache the clob client
let cachedClient: ClobClient | null = null;

interface TradeParams {
    tokenId: string;
    price: number;
    size: number;
    side: 'BUY' | 'SELL';
}

interface TradeResult {
    success: boolean;
    orderID?: string;
    errorMsg?: string;
}

// initialize clob client with wallet signer
export async function initializeClobClient(signer: ethers.Signer): Promise<ClobClient> {
    if (cachedClient) {
        return cachedClient;
    }

    console.log('[sdk] initializing clob client...');

    // get the funder address (wallet address)
    const funderAddress = await signer.getAddress();

    // create initial client to derive credentials
    const tempClient = new ClobClient(
        CLOB_HOST,
        CHAIN_ID,
        signer as any // ethers v5 signer
    );

    console.log('[sdk] deriving api credentials...');
    const creds = await tempClient.createOrDeriveApiCreds();
    console.log('[sdk] credentials derived');

    // create full client with credentials
    cachedClient = new ClobClient(
        CLOB_HOST,
        CHAIN_ID,
        signer as any,
        creds,
        SIGNATURE_TYPE,
        funderAddress
    );

    console.log('[sdk] clob client initialized');
    return cachedClient;
}

// execute a trade using the sdk
export async function executeSdkTrade(
    client: ClobClient,
    params: TradeParams,
    tickSize: string = '0.01',
    negRisk: boolean = false
): Promise<TradeResult> {
    try {
        console.log('[sdk] creating order...', params);

        const result = await client.createAndPostOrder(
            {
                tokenID: params.tokenId,
                price: params.price,
                side: params.side === 'BUY' ? Side.BUY : Side.SELL,
                size: params.size,
            },
            { tickSize, negRisk },
            OrderType.GTC
        );

        console.log('[sdk] order result:', result);

        if (result.success) {
            return {
                success: true,
                orderID: result.orderID
            };
        } else {
            return {
                success: false,
                errorMsg: result.errorMsg || 'Order failed'
            };
        }
    } catch (error) {
        console.error('[sdk] trade error:', error);
        return {
            success: false,
            errorMsg: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// clear cached client (for logout)
export function clearClobClient(): void {
    cachedClient = null;
}
