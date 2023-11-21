/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Mocking NftsStore -----------------------------------

import {
    Address,
    Collectible,
    Network,
} from 'src/antelope/types';

export interface NFTsCollection {
    contract: Address;
    list: Collectible[];
    loading: boolean;
}

const __contracts: Record<Network, Record<Address, NFTsCollection>> = {};

const NftsStore = {
    __contracts,
};

export const useNftsStore = () => NftsStore;
