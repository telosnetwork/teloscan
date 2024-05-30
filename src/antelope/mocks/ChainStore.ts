/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Mocking ChainStore -----------------------------------
declare const fathom: { trackEvent: (eventName: string) => void };

import { RpcEndpoint } from 'universal-authenticator-library';
import { ChainSettings, NativeCurrencyAddress, TokenClass } from 'src/antelope/types';
import TelosEVM from 'src/antelope/chains/evm/telos-evm';
import TelosEVMTestnet from 'src/antelope/chains/evm/telos-evm-testnet';
import { ethers } from 'ethers';

export interface TeloscanEVMChainSettings {
    getStakedSystemToken(): TokenClass;
    getWrappedSystemToken: () => TokenClass;
    getChainId: () => string;
    getDisplay: () => string;
    trackAnalyticsEvent: (name: string) => void;
    getRPCEndpoint: () => RpcEndpoint;
    getEscrowContractAddress: () => string;
    getNetwork: () => string;
    getSystemToken: () => TokenClass;
    getExplorerUrl: () => string;
    getSmallLogoPath: () => string;
    getLargeLogoPath: () => string;
}

export const evmSettings: { [network: string]: TeloscanEVMChainSettings } = {
    'telos-evm': new TelosEVM('telos-evm'),
    'telos-evm-testnet': new TelosEVMTestnet('telos-evm-testnet'),
};

export const chains: { [network: string]: ChainModel } = {};

export interface ChainModel {
    settings: TeloscanEVMChainSettings;
}

export interface EvmChainModel {
    settings: TeloscanEVMChainSettings;
    gasPrice: ethers.BigNumber;
}

const newChainModel = (network: string, isNative: boolean): ChainModel => {
    const model = {
        lastUpdate: 0,
        apy: '',
        stakeRatio: ethers.constants.Zero,
        unstakeRatio: ethers.constants.Zero,
        settings: evmSettings[network],
        tokens: [],
    } as unknown as ChainModel;
    if (!isNative) {
        (model as unknown as EvmChainModel).gasPrice = ethers.constants.Zero;
    }
    return model;
};

/*
const settings = {
    getChainId: () => process.env.NETWORK_EVM_CHAIN_ID,
    getDisplay: () => process.env.NETWORK_EVM_DISPLAY,
    trackAnalyticsEvent(eventName: string): void {
        if (typeof fathom === 'undefined') {
            console.warn(`Failed to track event with name ${eventName}: Fathom Analytics not loaded`);
            return;
        }

        fathom.trackEvent(eventName);
    },
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
    getExplorerUrl: () => window.location.origin,
    getSmallLogoPath: () => 'small-icon-url',
    getLargeLogoPath: () => 'large-icon-url',
} as TeloscanEVMChainSettings;
*/

let current = {
    settings: evmSettings['telos-evm'],
} as unknown as ChainModel;

const ChainStore = {
    currentChain: current as unknown as ChainModel,
    loggedChain: current as unknown as ChainModel,
    loggedEvmChain: current as unknown as ChainModel,
    getNetworkSettings: (network: string) => current.settings,
    getChain: (label: string) => ChainStore.currentChain,
    setChain: (label: string, network: string) => {
        console.error('ChainStore.setChain', label, network);
        if (network in evmSettings) {

            // create the chain model if it doesn't exist
            if (!chains[network]) {
                chains[network] = newChainModel(network, false);
            }

            // make the change only if they are different
            if (network !== current.settings.getNetwork()) {
                current = chains[network];
                ChainStore.currentChain = current;
                ChainStore.loggedChain = current;
                ChainStore.loggedEvmChain = current;
            }
        } else {
            throw new Error(`Network '${network}' not supported`);
        }
    },
};

export const useChainStore = () => ChainStore;

/*

// TODO: put this code somewhere else
setTimeout(() => {
    if (process.env.NETWORK === 'mainnet') {
        ChainStore.setChain('mainnet', 'telos-evm');
    } else {
        ChainStore.setChain('testnet', 'telos-evm-testnet');
    }
}, 1000);

*/
