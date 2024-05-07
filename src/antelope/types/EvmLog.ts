import { ethers } from 'ethers';
import { TokenSourceInfo } from 'src/antelope/types';

export interface EvmLog {
    address: string;
    blockHash: string;
    blockNumber: number;
    data: string;
    logIndex: string;
    removed: boolean;
    topics: string[];
    transactionHash: string;
    transactionIndex: string;
}

export type EvmLogs = EvmLog[];

export interface EvmFormatedLog extends ethers.utils.LogDescription {
    inputs: ethers.utils.ParamType[];
    function_signature: string;
    isTransfer: boolean;
    logIndex: string,
    address: string,
    token: TokenSourceInfo | null,
    name: string,
}
