export interface BlockData {
    number: string;             // this is returning from indexer but it should be called blockNumber
    blockNumber: number;        // replicates the number value in number format (not string)
    blockHeight?: number;
    transactionsCount: number;  // replicates the transactionsCount value in number format (not string) https://api.testnet.teloscan.io/v1/blocks?includeCount=true
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
