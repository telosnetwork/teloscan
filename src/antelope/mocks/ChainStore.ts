/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Mocking ChainStore -----------------------------------

import { RpcEndpoint } from 'universal-authenticator-library';
import { NativeCurrencyAddress, TokenClass } from 'src/antelope/wallets/types';

export interface EVMChainSettings {
    getStakedSystemToken(): TokenClass;
    getWrappedSystemToken: () => TokenClass;
    getChainId: () => string;
    getDisplay: () => string;
    trackAnalyticsEvent: (o: {id:string}) => void;
    getRPCEndpoint: () => RpcEndpoint;
    getEscrowContractAddress: () => string;
    getNetwork: () => string;
    getSystemToken: () => TokenClass;
    getExplorerUrl: () => string;
    getSmallLogoPath: () => string;
    getLargeLogoPath: () => string;
}

const settings = {
    getChainId: () => process.env.NETWORK_EVM_CHAIN_ID,
    getDisplay: () => process.env.NETWORK_EVM_DISPLAY,
    trackAnalyticsEvent: () => void 0,
    getRPCEndpoint: () => {
        // extract the url parts
        const regex = /^(https?):\/\/([^:/]+)(?::(\d+))?(\/.*)?$/;
        const match = (process.env.NETWORK_EVM_RPC as string).match(regex);
        if (!match) {
            throw new Error('Invalid RPC endpoint');
        }
        // We destructure the result of the match to get each component
        const [, protocol, host, port, path] = match;
        return {
            protocol,
            host,
            port: port ? parseInt(port, 10) : 443,
            path: path || '/',
        };
    },
    getEscrowContractAddress: () => process.env.TELOS_ESCROW_CONTRACT_ADDRESS,
    getStakedSystemToken: () => ({
        address: process.env.STAKED_TLOS_CONTRACT_ADDRESS,
        decimals: 18,
        symbol: 'STLOS',
    } as TokenClass),
    getWrappedSystemToken: () => ({
        address: process.env.WRAPPED_TLOS_CONTRACT_ADDRESS,
        decimals: 18,
        symbol: 'WTLOS',
    } as TokenClass),
    getSystemToken: () => ({
        name: 'Telos',
        address: NativeCurrencyAddress,
        decimals: 18,
        symbol: 'TLOS',
    } as TokenClass),
    getNetwork: () => process.env.NETWORK_EVM_NAME,
    getExplorerUrl: () => process.env.NETWORK_EXPLORER,
    getSmallLogoPath: () => 'small-icon-url',
    getLargeLogoPath: () => 'large-icon-url',
} as EVMChainSettings;

const currentChain = {
    settings,
};

const loggedChain = {
    settings,
};

const ChainStore = {
    currentChain,
    loggedChain,
    getNetworkSettings: (network: string) => settings,
    getChain: (label: string) => currentChain,
    setChain: (context: string, network: string) => void 0,
};

export const useChainStore = () => ChainStore;
