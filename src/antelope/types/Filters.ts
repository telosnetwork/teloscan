import { NftTokenInterface } from 'src/antelope/types/NFTClass';


export interface HyperionAbiSignatureFilter {
    type?: string;
    hex?: string;
}

export interface HyperionActionsFilter {
    page?: number;
    skip?: number;// skip overrides `page`
    limit?: number;
    account?: string;
    notified?: string;
    sort?: 'desc' | 'asc';
    after?: string;
    before?: string;
    extras?: { [key: string]: string };
    address?: string;
    block?: string;
    hash?: string;
}

export interface IndexerPaginationFilter {
    limit?: number; // integer value to limit number of results
    offset?: number; // integer value to offset the results of the query
}

export interface IndexerTransactionsFilter extends IndexerPaginationFilter {
    address: string;
    includeAbi?: boolean; // indicate whether to include abi
    sort?: 'DESC' | 'ASC'; // sort transactions by id (DESC or ASC)
    includePagination?: boolean; // include the total count and more flag in response
    logTopic?: string; // match to the transaction logs' first topic
    full?: string; // Add internal transactions to the response
    forceMetadata?: number; // 1 to force metadata to be returned
    type?: 'erc721' | 'erc1155';
}

export interface IndexerTransfersFilter extends IndexerPaginationFilter {
    account: string;
    type?: 'erc20' | 'erc721' | 'erc1155' | 'none'; // filter by token type
    includePagination?: boolean; // include the total count and more flag in response
    endBlock?: number; // last block to include in the query
    startBlock?: number; // first block to include in the query
    contract?: string; // filter by contract address
    includeAbi?: boolean; // indicate whether to include abi
    tokenId?: number; // optional id for an NFT in a given collection
}

export interface IndexerAccountNftsFilter extends IndexerPaginationFilter {
    type: NftTokenInterface;
    sort?: 'DESC' | 'ASC'; // sort by NFT ID (DESC or ASC)
    includeAbi?: boolean; // indicate whether to include abi
    contract?: string; // only query results for a specific contract address
    forceMetadata?: boolean; // whether to include NFT metadata or not
    includeTokenIdSupply?: true; // whether to include NFT token ID and supply or not, only valid for erc1155
}

export interface IndexerCollectionNftsFilter extends IndexerPaginationFilter {
    sort?: 'DESC' | 'ASC'; // sort by NFT ID (DESC or ASC)
    includePagination?: boolean; // indicate whether to include pagination
    forceMetadata?: boolean; // whether to include NFT metadata or not
    includeAbi?: boolean; // indicate whether to include abi
    tokenId?: string; // only query results for a specific token ID
    includeTokenIdSupply?: boolean;
}
