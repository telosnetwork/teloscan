/* eslint-disable max-len */

import { EvmABI, erc1155Abi, erc20Abi, erc721Abi } from 'src/antelope/types';
import EvmContract from 'src/antelope/wallets/utils/contracts/EvmContract';
import { contractManager } from 'src/boot/evm.js';

// Mocking ContractStore -----------------------------------
const ContractStore = {
    getTokenABI(type:string): EvmABI {
        if(type === 'erc721'){
            return erc721Abi;
        } else if(type === 'erc1155'){
            return erc1155Abi;
        }
        return erc20Abi;
    },
    async getContract(label: string, address:string, suspectedToken = ''): Promise<EvmContract | null> {
        return contractManager.getContract(label, address, suspectedToken);
    },
};

export const useContractStore = () => ContractStore;
