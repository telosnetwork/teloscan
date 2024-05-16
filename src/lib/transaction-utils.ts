import { ethers } from 'ethers';

import { indexerApi } from 'src/boot/telosApi';
import { contractManager } from 'src/boot/telosApi';

import { EvmTransaction, EvmTransactionLog } from 'src/antelope/types';
import { EvmTransactionExtended, NftTransferData } from 'src/types';
import { TransactionDescription } from 'ethers/lib/utils';
import { WEI_PRECISION, formatWei, parseErrorMessage } from 'src/lib/utils';

import { toChecksumAddress } from 'src/lib/utils';

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
    if (method[1]) {
        return {
            name: method[1],
        } as TransactionDescription;
    } else {
        return undefined;
    }
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

export const getParsedInternalTransactions = async (hash: string, $t: (k:string)=>string) => new Promise<{itxs:unknown[], parsedItxs:unknown[]}>((resolve, reject) => {
    const query = `/transaction/${hash}/internal?limit=1000&sort=ASC&offset=0&includeAbi=1`;
    indexerApi.get(query).then(async (response) => {
        if(response && response.data?.results?.length > 0) {
            const dataset = response.data?.results;
            contractManager.addContractsToCache(response.data?.contracts);
            const itxs = [];
            const parsedItxs = [];
            for (let k = 0; k < dataset.length; k++) {
                const itx = dataset[k];

                // Get rid of duplicated calls
                if(k === 1){
                    if(itx.action.input === dataset[k - 1].action.input
                            && itx.action.from === dataset[k - 1].action.from
                            && itx.action.to === dataset[k - 1].action.to
                            && itx.action.value === dataset[k - 1].action.value
                    ){
                        continue;
                    }
                }

                itx.callType = itx.action.callType;
                const contract = await contractManager.getContract(itx.action.to);
                let inputs, outputs, args, name, isTransferETH = false;

                if (itx.type === 'create') {
                    name = $t('components.transaction.contract_deployment');
                } else if (+itx.action.value > 0) {
                    name = $t('components.transaction.tlos_transfer');
                    isTransferETH = true;
                }

                if (itx.action.input) {
                    const parsedTransaction = await contractManager.parseContractTransaction(
                        itx,
                        itx.action.input,
                        contract,
                    );
                    if (parsedTransaction) {
                        args = parsedTransaction.args;
                        name = parsedTransaction.signature;
                        isTransferETH = false;
                        outputs = parsedTransaction.functionFragment ?
                            parsedTransaction.functionFragment.outputs :
                            parsedTransaction.outputs;

                        inputs = parsedTransaction.functionFragment ?
                            parsedTransaction.functionFragment.inputs :
                            parsedTransaction.inputs;
                    }
                }
                itxs.push(itx);
                parsedItxs.push({
                    index: itx.index,
                    type: itx.type,
                    args: args,
                    error: (itx.error !== null && itx.result?.output?.slice(0, 10) === '0x08c379a0')
                        ? itx.error + ': ' + parseErrorMessage(itx.result?.output)
                        : itx.error,
                    traceAddress: itx.traceAddress,
                    parent: itx.traceAddress[0] || 0,
                    name: name,
                    from: itx.action?.from,
                    isTransferETH: isTransferETH,
                    sig: (itx.action.input) ? itx.action.input.slice(0, 10) : '',
                    inputs: inputs,
                    outputs: outputs,
                    depth: itx.traceAddress.length,
                    to: itx.action?.to,
                    contract: contract,
                    value: (itx.type !== 'create' && itx.action?.value !== '0')
                        ? formatWei(itx.action.value, WEI_PRECISION)
                        : 0,
                });
            }
            parsedItxs.sort((a, b) => {
                const deeper = (a.traceAddress.length > b.traceAddress.length) ? a : b;
                let result = 0;
                for(let i = 0; i < deeper.traceAddress.length;i++){
                    const valueA = a.traceAddress[i] || -1;
                    const valueB = b.traceAddress[i] || -1;
                    result = result + (valueA - valueB);
                }
                return result;
            });
            resolve({
                parsedItxs,
                itxs,
            });
        } else {
            console.error(`Could not retrieve internal transactions for transaction ${hash}`,
                response,
            );
            reject();
        }
    }).catch((e) => {
        console.error(`Could not retrieve internal transactions for transaction: ${e}`);
        reject();
    });
});
export const getDirection = (address: string, row: NftTransferData) => {
    if (toChecksumAddress(row.to) === toChecksumAddress(row.from)) {
        return 'self';
    } else if (toChecksumAddress(address) === toChecksumAddress(row.from)) {
        return 'out';
    } else if (toChecksumAddress(address) === toChecksumAddress(row.to)) {
        return 'in';
    } else {
        return 'to';
    }
};

