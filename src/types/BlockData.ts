export interface BlockData {
    number: string;             // this is returning from indexer but it should be called blockHeight
    blockHeight: number;        // replicates the number value in number format (not string)
    transactionCount: string;   // this is returning from indexer but it should be called transactionsCount: https://api.testnet.teloscan.io/v1/blocks?includeCount=1
    transactionsCount: number;  // replicates the transactionCount value in number format (not string)
    logsBloom: string;
    gasLimit: string;
    gasUsed: string;
    size: string;
    extraData: string;
    transactionsRoot: string;
    sha3Uncles: string;
    parentHash: string;
    nonce: string;
    hash: string;
    timestamp: number;
}
