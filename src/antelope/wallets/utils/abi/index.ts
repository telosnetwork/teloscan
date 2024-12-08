export * from 'src/antelope/wallets/utils/abi/erc721';
export * from 'src/antelope/wallets/utils/abi/erc721Metadata';
export * from 'src/antelope/wallets/utils/abi/erc1155';
export * from 'src/antelope/wallets/utils/abi/erc20';
export * from 'src/antelope/wallets/utils/abi/supportsInterface';
export * from 'src/antelope/wallets/utils/abi/wrapAbi';
export * from 'src/antelope/wallets/utils/abi/stlosAbi';
export * from 'src/antelope/wallets/utils/abi/escrowAbi';
export * from 'src/antelope/wallets/utils/abi/signature/transfer_signatures';

export type StateMutabilityType = 'pure' | 'view' | 'nonpayable' | 'payable';
export type addressString = `0x${string}`; // required wagmi type

export type EvmABI = EvmABIEntry[];

export interface EvmABIEntry {
    constant?: boolean;
    payable?: boolean;
    anonymous?: boolean;
    inputs?: EvmABIEntryInput[];
    outputs?: EvmABIEntryOutput[];
    stateMutability?: StateMutabilityType;
    name: string;
    type: string;
}

export interface EvmABIEntryInput {
    indexed: boolean;
    internalType: string;
    name: string;
    type: string;
}

export interface EvmABIEntryOutput {
    internalType: string;
    name: string;
    type: string;
}

export interface AbiSignature {
    text_signature: string;
}

