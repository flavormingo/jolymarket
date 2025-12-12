import { ClobClient, OrderType, Side, type ApiKeyCreds } from '@dschz/polymarket-clob-client';
import type { JsonRpcSigner } from '@ethersproject/providers';

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137;

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

export async function initializeClobClient(signer: JsonRpcSigner): Promise<ClobClient> {
    if (cachedClient) {
        return cachedClient;
    }

    console.log('[sdk] initializing clob client...');

    const funderAddress = await signer.getAddress();

    const tempClient = new ClobClient({
        host: CLOB_HOST,
        chainId: CHAIN_ID,
        signer: signer
    });

    console.log('[sdk] deriving api credentials...');

    let creds: ApiKeyCreds;
    try {
        creds = await tempClient.createOrDeriveApiKey();
    } catch (error) {
        const errorStr = String(error);
        if (errorStr.includes('Could not create api key') ||
            errorStr.includes('400') ||
            errorStr.includes('geo')) {
            throw new Error('REGION_BLOCKED: trading is not currently available in your region. polymarket restricts access from the united states and certain other locations.');
        }
        throw error;
    }

    if (!creds || !creds.key || !creds.secret || !creds.passphrase) {
        console.error('[sdk] invalid credentials received:', creds);
        throw new Error('REGION_BLOCKED: trading is not currently available in your region. polymarket restricts access from the united states and certain other locations.');
    }
    console.log('[sdk] credentials derived successfully');

    cachedClient = new ClobClient({
        host: CLOB_HOST,
        chainId: CHAIN_ID,
        signer: signer,
        creds: creds,
        funderAddress: funderAddress
    });

    console.log('[sdk] clob client initialized');
    return cachedClient;
}

export async function executeSdkTrade(
    client: ClobClient,
    params: TradeParams
): Promise<TradeResult> {
    try {
        console.log('[sdk] creating order...', params);

        const tickSize = await client.getTickSize(params.tokenId);
        const negRisk = await client.getNegRisk(params.tokenId);

        console.log('[sdk] tickSize:', tickSize, 'negRisk:', negRisk);

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
        const errorStr = error instanceof Error ? error.message : String(error);

        if (errorStr.includes('atob') || errorStr.includes('not correctly encoded')) {
            return {
                success: false,
                errorMsg: 'trading is not currently available in your region. polymarket restricts access from the united states and certain other locations.'
            };
        }

        return {
            success: false,
            errorMsg: errorStr
        };
    }
}

export function clearClobClient(): void {
    cachedClient = null;
}
