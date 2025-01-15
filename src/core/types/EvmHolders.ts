import { IndexerContractData } from 'src/core/types/EvmTransaction';

export interface EvmHolder {
    rank: number;
    address: string;
    balance: string;
    updated: number;
    trxCount: number;
}

export interface IndexerHoldersResponse {
    abi: {
        [code: string]: string
    };
    code: number;
    contracts: {
        [contractHash: string]: IndexerContractData
    };
    message: string;
    more: boolean;
    results: EvmHolder[]
    success: boolean;
    total_count: number;
}

