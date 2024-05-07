// Indexer Nft Response --------

export const INVALID_METADATA = '___INVALID_METADATA___'; // string given by indexer for NFTs with invalid metadata

interface IndexerNftResponse {
    success: boolean;
    contracts: {
        [address: string]: IndexerContract;
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
    owner?: string; // present only for ERC721
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

export interface IndexerContract {
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
        [address: string]: IndexerContract;
    };
    results: {
        address: string; // holder address
        balance: number;
        tokenid: number;
        updated: number; // ms since epoch
    }[];
}

// Allowances
interface IndexerAllowanceResult {
    owner: string; // address of the token owner;
    contract: string; // address of the token contract
    updated: number; // timestamp of the last time the allowance was updated - ms since epoch
}

export interface IndexerErc20AllowanceResult extends IndexerAllowanceResult {
    amount: string; // string representation of a number; the amount of tokens the owner has approved for the spender in the token's smallest unit
    spender: string; // address of the spender contract
}

export interface IndexerErc721AllowanceResult extends IndexerAllowanceResult {
    single: false; // whether the allowance is for a single token or for the entire collection
    approved: boolean; // whether the user has approved the spender
    operator: string; // address of the spender contract

    tokenId?: string | number; // only present if single === true
}

export interface IndexerErc1155AllowanceResult extends IndexerAllowanceResult {
    approved: boolean; // whether the user has approved the spender
    operator: string; // address of the spender contract
}

export interface IndexerAllowanceResponseErc20 {
    contracts: {
        [address: string]: IndexerContract;
    }
    results: IndexerErc20AllowanceResult[],
}

export interface IndexerAllowanceResponseErc721 {
    contracts: {
        [address: string]: IndexerContract;
    }
    results: IndexerErc721AllowanceResult[],
}

export interface IndexerAllowanceResponseErc1155 {
    contracts: {
        [address: string]: IndexerContract;
    }
    results: IndexerErc1155AllowanceResult[],
}

export type IndexerAllowanceResponse = IndexerAllowanceResponseErc20 | IndexerAllowanceResponseErc721 | IndexerAllowanceResponseErc1155;


// old version ----------

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
