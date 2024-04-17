import { ethers } from 'ethers';
import { indexerApi } from 'src/boot/telosApi';

import { EvmTransaction, EvmTransactionLog } from 'src/antelope/types';
import { EvmTransactionExtended } from 'src/types';
import { TransactionDescription } from 'ethers/lib/utils';

export const tryToExtractMethod = (abi: {[hash: string]: string }, input: string) => {
    if (!abi || !input) {
        return undefined;
    }
    const methodSignature = input.slice(0, 10);
    const functionSignature = abi[methodSignature];

    const method = functionSignature?.match(/function\s+(\w+)\(/);
    if (!method) {
        return undefined;
    }
    return {
        name: method[1],
    } as TransactionDescription;
};
export const loadTransaction = async (hash: string): Promise<EvmTransactionExtended | null>  => {
    try {
        const trxResponse = await indexerApi.get(`/transaction/${hash}?full=true&includeAbi=true`);
        const abi = trxResponse.data.abi;
        if (trxResponse.data.results.length === 0) {
            console.error(`Transaction ${hash} not found`);
            return null;
        }
        const aux = trxResponse.data.results[0] as EvmTransaction;
        let logsArray: EvmTransactionLog[] = [];
        if(aux.logs){
            const fixedStr = aux.logs.replace('transaction_hash', 'transactionHash');
            try {
                logsArray = JSON.parse(fixedStr) as EvmTransactionLog[];
            } catch (e) {
                console.error('Error parsing logs', e);
            }
        }

        const parsedTransaction = tryToExtractMethod(abi, aux.input);
        const _trx:EvmTransactionExtended = {
            ...aux,
            gasUsedBn: ethers.BigNumber.from(aux.gasUsed),
            gasLimitBn: ethers.BigNumber.from(aux.gasLimit),
            valueBn: ethers.BigNumber.from(aux.value),
            gasPriceBn: ethers.BigNumber.from(aux.gasPrice),
            contract: undefined,
            parsedTransaction,
            functionParams: [],
            logsArray,
        };
        return _trx;
    } catch (e) {
        console.error('Error resolving method name', e);
        return null;
    }
};
