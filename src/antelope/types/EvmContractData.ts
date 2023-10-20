/* eslint-disable no-unused-vars */
import { ethers } from 'ethers';
import type { TokenSourceInfo } from 'src/antelope/types';
import type { EvmABI } from 'src/antelope/types';

export interface EvmContractConstructorData {
    address: string;
    name: string;
    manager?: EvmContractManagerI;
    creationInfo?: EvmContractCreationInfo | null;
    abi?: EvmABI | string;
    token?: TokenSourceInfo;
    verified?: boolean;
    supportedInterfaces: string[];
    properties?: EvmContractCalldata;
}

export interface EvmContractManagerI {
    getSigner: () => Promise<ethers.Signer>;
    getWeb3Provider: () => Promise<ethers.providers.Web3Provider>;
    getFunctionIface: (hash:string) => Promise<ethers.utils.Interface | null>;
    getEventIface: (hash:string) => Promise<ethers.utils.Interface | null>;
}

export interface EvmContractCreationInfo {
    block?: number | null;
    block_num?: number; // same as block, kept for legacy usage
    creator?: string | null;
    transaction: string;
    creation_trx: string; // same as transaction, kept for legacy usage
    timestamp?: string; // string number like "1679649071"
    abi?: string | EvmABI;
}

export interface EvmContractMetadata {
    compiler?: {
        version: string;
    };
    language?: string;
    output?: {
        abi: EvmABI;
        devdoc: {
            kind: string;
            methods: Record<string, { details: string }>;
            version: number;
        };
        userdoc: {
            kind: string;
            methods: Record<string, { details: string }>;
            version: number;
        }
    };
    settings?: {
        compilationTarget: Record<string, string>;
        evmVersion: string;
        libraries: Record<string, string>;
        metadata: {
            bytecodeHash: string;
            useLiteralContent: boolean;
        };
        optimizer: {
            enabled: boolean;
            runs: number;
        };
        remappings: Record<string, unknown>[]
    }
    sources?: Record<string, {
        content: string;
        keccak256: string;
        license: string;
    }>;
    version?: number;
}

export interface EvmContractCalldata {
    decimals?: number;
    holders?: string; // string representation of number
    marketdata_updated?: string; // epoch
    name?: string;
    price?: string; // string representation of number, USD price
    supply?: string; // string representation of number
    symbol?: string;
}

export interface EvmContractFactoryData {
    address: string;
    abi?: string | EvmABI
    block?: number;
    calldata?: string;
    creator?: string;
    decimals?: number | null;
    fromTrace?: boolean;
    metadata?: string;
    name?: string;
    supportedInterfaces?: string[];
    symbol?: string;
    traceAddress?: string;
    transaction?: string;
    timestamp?: string;
    manager?: EvmContractManagerI;
}

export type EvmFunctionParam = string | number | boolean | ethers.BigNumber;
