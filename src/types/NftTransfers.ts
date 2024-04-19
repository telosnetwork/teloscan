import { EvmTransactionExtended } from 'src/types/EvmTransactionExtended';

export interface NftTransferData {
    hash: string;
    timestamp: number;
    amount: string;
    id: string;
    value: string;
    contract: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
    };
    from: string;
    to: string;
    trx: EvmTransactionExtended | null;
}

export interface NftTransferProps {
    title: string;
    tokenType: string;
    address: string;
    initialPageSize: number;
}

