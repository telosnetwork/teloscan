import { BigNumber } from 'ethers';

export interface TransactionQueryData {
    data: {
        results: { hash: string}[];
        total_count: number;
    }
}

export interface InternalTransactionQueryData {
    data: {
        results: { transactionHash: string}[];
        total_count: number;
    }
}

export type OutputValue = string | string[] | BigNumber | BigNumber[] | number | number[] | boolean | boolean[] | null;

export interface OutputType {
    name: string,
    type: string,
    internalType: string,
    components?: OutputType[]
}

export interface OutputData {
    type: string;
    value: OutputValue;
}

export type OutputResult = {
    [name: string]: OutputData | OutputResult | OutputResult[];
};
