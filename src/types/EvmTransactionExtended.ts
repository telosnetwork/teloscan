import { TransactionDescription } from 'ethers/lib/utils';

import Contract from 'src/lib/contract/Contract';
import { EvmContractFunctionParameter, EvmTransactionParsed } from 'src/antelope/types';

export interface EvmTransactionExtended extends EvmTransactionParsed {
    contract: Contract | undefined;
    parsedTransaction: TransactionDescription | undefined;
    functionParams: EvmContractFunctionParameter[];
}
