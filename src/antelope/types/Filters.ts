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

export interface IndexerTransactionsFilter {
    address: string;
    limit?: number; // integer value to limit number of results
    offset?: number; // integer value to offset the results of the query
    includeAbi?: boolean; // indicate whether to include abi
    sort?: 'DESC' | 'ASC'; // sort transactions by id (DESC or ASC)
    includePagination?: boolean; // include the total count and more flag in response
    logTopic?: string; // match to the transaction logs' first topic
    full?: string; // Add internal transactions to the response
    forceMetadata?: number; // 1 to force metadata to be returned
}

export interface IndexerTransfersFilter {
    account: string;
    type?: 'erc20' | 'erc721' | 'erc1155'; // filter by token type
    limit?: number; // integer value to limit number of results
    offset?: number; // integer value to offset the results of the query
    includePagination?: boolean; // include the total count and more flag in response
    endBlock?: number; // last block to include in the query
    startBlock?: number; // first block to include in the query
    contract?: string; // filter by contract address
    includeAbi?: boolean; // indicate whether to include abi
}
