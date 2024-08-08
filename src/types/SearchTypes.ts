
export type SearchResultCategory = 'contract' | 'tokens' | 'nft' | 'address' | 'transaction' | 'block' | 'unknown';
export type SearchResultType = 'contract' | 'address' | 'transaction' | 'block';
export type SearchResultInterfaces = 'none' | 'erc20' | 'erc721' | 'erc721_metadata' | 'erc1155' | 'erc1155_metadata';
export interface SearchResultRaw {
    type: SearchResultType,         // all
    hash?: string;                  // transactions, blocks
    number?: number;                // blocks
    address?: string;               // contracts, addresses
    symbol?: string;                // tokens
    price?: number;                 // tokens
    decimals?: number;              // tokens
    name?: string;                  // contracts, tokens
    verified?: boolean;             // contracts, tokens
    supportedInterfaces?: string;   // contracts, tokens, nfts
    issuer?: string | null;         // tokens
}
export interface SearchResultContract {
    category: 'contract';
    type: 'contract';
    address: string;
    name: string;
    verified: boolean;
    supportedInterfaces: SearchResultInterfaces[];
}
export interface SearchResultToken {
    category: 'token';
    type: 'contract';
    address: string;
    name: string;
    symbol: string;
    price: number;
    decimals: number;
    verified: boolean;
    issuer: string | null | undefined;
    supportedInterfaces: SearchResultInterfaces[];
    priceUSD: string;
    icon: string;
}
export interface SearchResultNFT {
    category: 'nft';
    type: 'contract';
    address: string;
    name: string;
    symbol: string;
    price: number;
    verified: boolean;
    supportedInterfaces: SearchResultInterfaces[];
    nftType: string;
    priceUSD: string;
    img: string;
}
export interface SearchResultTrx {
    category: 'transaction';
    type: 'transaction';
    hash: string;
}
export interface SearchResultAddress {
    category: 'address';
    type: 'address';
    address: string;
    balance: string;
}
export interface SearchResultBlock {
    category: 'block';
    type: 'block';
    number: number;
}
export interface SearchResultUnknown {
    category: 'unknown';
    type: 'unknown';
}

export type SearchResult = SearchResultContract | SearchResultToken | SearchResultNFT | SearchResultTrx | SearchResultAddress | SearchResultBlock | SearchResultUnknown;
