export interface BlockData {
    transactionsCount: number;
    number: string;
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
