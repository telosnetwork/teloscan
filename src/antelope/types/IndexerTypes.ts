// Indexer Nft Response --------

export const INVALID_METADATA = '___INVALID_METADATA___'; // string given by indexer for NFTs with invalid metadata

interface IndexerNftResponse {
    success: boolean;
    contracts: {
        [address: string]: IndexerNftContract;
    };
}

export interface IndexerCollectionNftsResponse extends IndexerNftResponse {
    results: IndexerCollectionNftResult[];
}

export interface IndexerAccountNftsResponse extends IndexerNftResponse {
    results: IndexerAccountNftResponse[];
}

export interface IndexerNftItemAttribute {
    value: string;
    trait_type: string;
    display_type?: string;
}

export type IndexerNftMetadata = {
    dna?: string;
    date?: number;
    name?: string;
    image?: string;
    edition?: number;
    compiler?: string;
    imageHash?: string;
    attributes?: IndexerNftItemAttribute[];
    description?: string;
    [key: string]: unknown;
} | null;

interface IndexerNftResult {
    metadata: string;
    tokenId: string;
    contract: string;
    updated: number;
    imageCache?: string;
    tokenUri?: string;
}

// results from the /contract/{address}/nfts endpoint
export interface IndexerCollectionNftResult extends IndexerNftResult {
    supply?: number; // present only for ERC1155
}

// results from the /account/{address}/nfts endpoint
export interface IndexerAccountNftResponse extends IndexerNftResult {
    amount?: number; // present only for ERC1155
    minter: string;
    blockMinted: number;
    tokenIdSupply?: number; // present only for ERC1155
    owner: string;
}

// used as an intermediate type for constructing NFTs from IndexerAccountNftResponse/IndexerCollectionNftResult
export interface GenericIndexerNft {
    metadata: Record<string, unknown> | string; // object or JSON object string
    tokenId: string;
    contract: string;
    updated: number;
    imageCache?: string;
    tokenUri?: string;
    supply?: number; // present only for ERC1155
    minter?: string;
    blockMinted?: number;
    owner?: string; // present only for ERC721
}

export interface IndexerNftContract {
    symbol: string;
    creator: string;
    address: string;
    fromTrace: boolean;
    trace_address: string;
    supply: string;
    calldata?: {
        name?: string;
        supply?: string;
        symbol?: string;
    },
    decimals: number | null;
    name: string;
    block: number;
    supportedInterfaces?: string[];
    transaction: string;
}




// -------

export interface IndexerTokenInfo {
    symbol: string;
    creator: string;
    address: string;
    fromTrace: boolean;
    trace_address: string;
    logoURI: string;
    supply: string;
    calldata: IndexerTokenMarketData;
    decimals: number;
    name: string;
    block: number;
    supportedInterfaces: string[];
    transaction: string;
}

export interface IndexerTokenMarketData {
    name?: string;
    price?: number;
    supply?: string;
    symbol?: string;
    volume?: string;
    holders?: string;
    decimals?: number;
    marketcap?: string;
    max_supply_ibc?: string;
    total_supply_ibc?: string;
    marketdata_updated?: string;
}

export interface IndexerTokenBalance {
    address: string;
    balance: string;
    contract: string;
    updated: number;
}


export interface IndexerAccountBalances {
    success: boolean;
    contracts: {
        [address: string]: IndexerTokenInfo;
    };
    results: IndexerTokenBalance[];
}

export interface IndexerHealthResponse {
    success: boolean;
    blockNumber: number;
    blockTimestamp: string;
    secondsBehind: number;
}

export interface IndexerTokenHoldersResponse {
    contracts: {
        [address: string]: IndexerNftContract;
    };
    results: {
        address: string; // holder address
        balance: number;
        tokenid: number;
        updated: number; // ms since epoch
    }[];
}
