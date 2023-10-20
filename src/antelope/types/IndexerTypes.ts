// Indexer Nft Response --------

export interface IndexerNftResponse {
    success: boolean;
    contracts: {
        [address: string]: IndexerNftContract;
    };
    results: IndexerNftItemResult[];
}

export interface IndexerNftItemAttribute {
    value: string;
    trait_type: string;
    display_type?: string;
}

export interface IndexerNftItemResult {
    metadata: {
        dna?: string;
        date?: number;
        name?: string;
        image?: string;
        edition?: number;
        compiler?: string;
        imageHash?: string;
        attributes?: IndexerNftItemAttribute[];
        description?: string;
    } | {
        [key: string]: unknown;
    } | null;
    owner: string; // address
    minter: string; // address
    tokenId: string;
    tokenUri: string;
    contract: string; // address
    imageCache?: string; // url
    blockMinted: number;
    updated: number; // epoch
    transaction: string; // tx hash
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
    supportedInterfaces: string[];
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
