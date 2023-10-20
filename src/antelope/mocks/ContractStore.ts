/* eslint-disable max-len */

import { EvmABI, erc1155Abi, erc20Abi, erc721Abi } from 'src/antelope/types';

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
};

export const useContractStore = () => ContractStore;
