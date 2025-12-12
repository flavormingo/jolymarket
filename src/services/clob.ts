// polymarket clob (central limit order book) trading service
// uses ethers v5 for wallet signing

import { ethers } from 'ethers';

// use proxy for all environments (vercel.json rewrites to polymarket)
const CLOB_API_BASE = '/api/clob';
const CHAIN_ID = 137; // polygon mainnet

// api credentials type
interface ApiCredentials {
    apiKey: string;
    secret: string;
    passphrase: string;
}

// order parameters
interface OrderParams {
    tokenId: string;
    price: number;
    size: number;
    side: 'BUY' | 'SELL';
}

// order response
interface OrderResponse {
    orderID: string;
    status: string;
    errorMsg?: string;
}

// trade data
interface TradeData {
    id: string;
    taker_order_id: string;
    market: string;
    asset_id: string;
    side: string;
    size: string;
    fee_rate_bps: string;
    price: string;
    status: string;
    match_time: string;
    last_update: string;
    outcome: string;
    owner: string;
    transaction_hash: string;
}

// create hmac signature for api requests
async function createHmacSignature(
    secret: string,
    timestamp: string,
    method: string,
    path: string,
    body: string = ''
): Promise<string> {
    const message = timestamp + method + path + body;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// build l1 auth headers (for deriving credentials) using EIP-712 signature
async function buildL1Headers(signer: ethers.Signer): Promise<Record<string, string>> {
    const address = await signer.getAddress();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = '0'; // polymarket uses 0 for derive-api-key

    // EIP-712 domain for Polymarket CLOB auth
    const domain = {
        name: 'ClobAuthDomain',
        version: '1',
        chainId: CHAIN_ID
    };

    // EIP-712 message types
    const types = {
        ClobAuth: [
            { name: 'address', type: 'address' },
            { name: 'timestamp', type: 'string' },
            { name: 'nonce', type: 'uint256' },
            { name: 'message', type: 'string' }
        ]
    };

    // message to sign
    const value = {
        address: address,
        timestamp: timestamp,
        nonce: nonce,
        message: 'This message attests that I control the given wallet'
    };

    // sign with EIP-712
    const typedSigner = signer as ethers.providers.JsonRpcSigner;
    const signature = await typedSigner._signTypedData(domain, types, value);

    return {
        'POLY_ADDRESS': address,
        'POLY_SIGNATURE': signature,
        'POLY_TIMESTAMP': timestamp,
        'POLY_NONCE': nonce
    };
}

// build l2 auth headers (for authenticated requests)
async function buildL2Headers(
    credentials: ApiCredentials,
    method: string,
    path: string,
    body: string = ''
): Promise<Record<string, string>> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await createHmacSignature(
        credentials.secret,
        timestamp,
        method,
        path,
        body
    );

    return {
        'POLY_API_KEY': credentials.apiKey,
        'POLY_PASSPHRASE': credentials.passphrase,
        'POLY_SIGNATURE': signature,
        'POLY_TIMESTAMP': timestamp
    };
}

// derive or create api credentials from wallet
export async function deriveApiCredentials(signer: ethers.Signer): Promise<ApiCredentials> {
    try {
        const headers = await buildL1Headers(signer);

        // include nonce as query parameter (must match nonce in signature)
        const nonce = headers['POLY_NONCE'];
        const url = `${CLOB_API_BASE}/auth/derive-api-key?nonce=${nonce}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });

        if (!response.ok) {
            // if no credentials exist, create new ones
            if (response.status === 404) {
                return createApiCredentials(signer);
            }
            // log full error for debugging
            const errorBody = await response.text();
            console.error('derive-api-key error:', response.status, errorBody);
            throw new Error(`failed to derive credentials: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('failed to derive api credentials:', error);
        throw error;
    }
}

// create new api credentials
async function createApiCredentials(signer: ethers.Signer): Promise<ApiCredentials> {
    const headers = await buildL1Headers(signer);

    const response = await fetch(`${CLOB_API_BASE}/auth/api-key`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });

    if (!response.ok) {
        throw new Error(`failed to create credentials: ${response.status}`);
    }

    return await response.json();
}

// get order book for a token
export async function getOrderBook(tokenId: string): Promise<{
    bids: Array<{ price: string; size: string }>;
    asks: Array<{ price: string; size: string }>;
}> {
    try {
        const response = await fetch(`${CLOB_API_BASE}/book?token_id=${tokenId}`);
        if (!response.ok) {
            throw new Error(`failed to fetch order book: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('failed to get order book:', error);
        throw error;
    }
}

// price history point from API
export interface PriceHistoryPoint {
    t: number; // timestamp
    p: number; // price
}

// get historical price data for a token
// interval options: "1m", "1h", "6h", "1d", "1w", "max"
// fidelity is resolution in minutes (e.g., 60 for hourly data)
export async function getPriceHistory(
    tokenId: string,
    interval: string = '1d',
    fidelity: number = 60
): Promise<PriceHistoryPoint[]> {
    try {
        const params = new URLSearchParams({
            market: tokenId,
            interval: interval,
            fidelity: fidelity.toString()
        });

        const response = await fetch(`${CLOB_API_BASE}/prices-history?${params}`);
        if (!response.ok) {
            throw new Error(`failed to fetch price history: ${response.status}`);
        }

        const data = await response.json();
        return data.history || [];
    } catch (error) {
        console.error('failed to get price history:', error);
        throw error;
    }
}

// get user's open orders
export async function getOpenOrders(credentials: ApiCredentials): Promise<OrderResponse[]> {
    try {
        const path = '/orders';
        const headers = await buildL2Headers(credentials, 'GET', path);

        const response = await fetch(`${CLOB_API_BASE}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });

        if (!response.ok) {
            throw new Error(`failed to fetch orders: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('failed to get open orders:', error);
        throw error;
    }
}

// get user's trade history
export async function getTrades(credentials: ApiCredentials): Promise<TradeData[]> {
    try {
        const path = '/trades';
        const headers = await buildL2Headers(credentials, 'GET', path);

        const response = await fetch(`${CLOB_API_BASE}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });

        if (!response.ok) {
            throw new Error(`failed to fetch trades: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('failed to get trades:', error);
        throw error;
    }
}

// create and post an order
export async function createAndPostOrder(
    signer: ethers.Signer,
    credentials: ApiCredentials,
    params: OrderParams
): Promise<OrderResponse> {
    try {
        const address = await signer.getAddress();

        // build order payload
        const order = {
            tokenID: params.tokenId,
            price: params.price,
            size: params.size,
            side: params.side,
            feeRateBps: '0', // no additional fees
            nonce: Math.floor(Math.random() * 1000000),
            expiration: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
            taker: '0x0000000000000000000000000000000000000000'
        };

        // create order signature using eip-712
        const domain = {
            name: 'Polymarket CTF Exchange',
            version: '1',
            chainId: CHAIN_ID,
            verifyingContract: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E' // ctf exchange
        };

        const types = {
            Order: [
                { name: 'salt', type: 'uint256' },
                { name: 'maker', type: 'address' },
                { name: 'signer', type: 'address' },
                { name: 'taker', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
                { name: 'makerAmount', type: 'uint256' },
                { name: 'takerAmount', type: 'uint256' },
                { name: 'expiration', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'feeRateBps', type: 'uint256' },
                { name: 'side', type: 'uint8' },
                { name: 'signatureType', type: 'uint8' }
            ]
        };

        // calculate amounts based on price and size
        const priceInWei = ethers.utils.parseUnits(params.price.toString(), 6);
        const sizeInWei = ethers.utils.parseUnits(params.size.toString(), 6);

        const orderData = {
            salt: order.nonce.toString(),
            maker: address,
            signer: address,
            taker: order.taker,
            tokenId: params.tokenId,
            makerAmount: params.side === 'BUY' ? priceInWei.mul(sizeInWei).div(1e6).toString() : sizeInWei.toString(),
            takerAmount: params.side === 'BUY' ? sizeInWei.toString() : priceInWei.mul(sizeInWei).div(1e6).toString(),
            expiration: order.expiration.toString(),
            nonce: order.nonce.toString(),
            feeRateBps: order.feeRateBps,
            side: params.side === 'BUY' ? 0 : 1,
            signatureType: 0
        };

        // get signer as typed data signer
        const typedSigner = signer as ethers.providers.JsonRpcSigner;

        // sign the order
        const signature = await typedSigner._signTypedData(domain, types, orderData);

        // post to clob
        const path = '/order';
        const body = JSON.stringify({
            order: orderData,
            signature
        });

        const headers = await buildL2Headers(credentials, 'POST', path, body);

        const response = await fetch(`${CLOB_API_BASE}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`failed to post order: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('failed to create and post order:', error);
        throw error;
    }
}

// cancel an order
export async function cancelOrder(
    credentials: ApiCredentials,
    orderId: string
): Promise<{ success: boolean }> {
    try {
        const path = `/order/${orderId}`;
        const headers = await buildL2Headers(credentials, 'DELETE', path);

        const response = await fetch(`${CLOB_API_BASE}${path}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });

        if (!response.ok) {
            throw new Error(`failed to cancel order: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        console.error('failed to cancel order:', error);
        throw error;
    }
}

// check if address has approved usdc for trading
export async function checkUsdcAllowance(
    provider: ethers.providers.Provider,
    address: string
): Promise<boolean> {
    const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'; // polygon usdc
    const CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

    const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        ['function allowance(address owner, address spender) view returns (uint256)'],
        provider
    );

    const allowance = await usdcContract.allowance(address, CTF_EXCHANGE);
    return allowance.gt(0);
}

// approve usdc for trading
export async function approveUsdc(signer: ethers.Signer): Promise<string> {
    const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
    const CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
    const MAX_UINT256 = ethers.constants.MaxUint256;

    const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
    );

    const tx = await usdcContract.approve(CTF_EXCHANGE, MAX_UINT256);
    await tx.wait();

    return tx.hash;
}
