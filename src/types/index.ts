export interface Market {
    id: string;
    question: string;
    description: string;
    image: string;
    slug: string;
    endDate: string;
    volume: number | string;
    liquidity: number | string;
    outcomePrices: string;
    outcomes: string;
    clobTokenIds: string;
    conditionId: string;
    questionId: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    acceptingOrders: boolean;
    tags?: Tag[];
}

export interface Event {
    id: string;
    slug: string;
    title: string;
    description: string;
    image: string;
    endDate: string;
    volume: number | string;
    liquidity: number | string;
    markets: Market[];
    tags?: Tag[];
    commentCount: number;
}

export interface Tag {
    id: string;
    slug: string;
    label: string;
}

export interface ParsedMarket {
    id: string;
    question: string;
    description: string;
    image: string;
    slug: string;
    eventSlug: string;  // event slug for navigation (different from market slug)
    endDate: Date;
    volume: number;
    liquidity: number;
    yesPrice: number;
    noPrice: number;
    yesTokenId: string;
    noTokenId: string;
    conditionId: string;
    active: boolean;
    closed: boolean;
    tags: string[];
}

export type Category =
    | 'all'
    | 'crypto'
    | 'culture'
    | 'earnings'
    | 'economy'
    | 'elections'
    | 'finance'
    | 'geopolitics'
    | 'politics'
    | 'sports'
    | 'tech'
    | 'world';

export type SortOption = 'trending' | 'new' | 'ending-soon';

export interface Order {
    tokenId: string;
    price: number;
    size: number;
    side: 'BUY' | 'SELL';
}

export interface Position {
    marketId: string;
    tokenId: string;
    outcome: 'yes' | 'no';
    size: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
}

export interface Trade {
    id: string;
    marketId: string;
    tokenId: string;
    side: 'BUY' | 'SELL';
    outcome: 'yes' | 'no';
    price: number;
    size: number;
    timestamp: Date;
}

export interface User {
    id: string;
    email: string;
    walletAddress?: string;
    createdAt: Date;
}
