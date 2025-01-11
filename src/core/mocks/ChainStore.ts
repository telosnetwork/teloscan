/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Mocking ChainStore -----------------------------------
declare const fathom: { trackEvent: (eventName: string) => void };

import { RpcEndpoint, UAL } from 'universal-authenticator-library';
import { TokenClass, Theme, Themes, SocialLink, FooterLinksConfig, HeaderMenuConfig, HeaderIndicators, IndexerHealthResponse } from 'src/core/types';
import TelosEVM from 'src/config/chains/telos-evm';
import TelosEVMTestnet from 'src/config/chains/telos-evm-testnet';
import { ethers } from 'ethers';
import { TelosEvmApi } from '@telosnetwork/telosevm-js';
import { AxiosInstance } from 'axios';
import ContractManager from 'src/lib/contract/ContractManager';
import TelosZkEVM from 'src/config/chains/telos-zkevm-testnet';
import { Observable } from 'rxjs';

export interface TeloscanEVMChainSettings {
    getStakedSystemToken(): TokenClass;
    getWrappedSystemToken: () => TokenClass;
    getChainId: () => string;
    getDisplay: () => string;
    getBranding: () => { icon: string; text: string };
    getApplicationTitle: () => string;
    trackAnalyticsEvent: (name: string) => void;
    getRPCEndpoint: () => RpcEndpoint;
    getEscrowContractAddress: () => string;
    getNetwork: () => string;
    getTokenListUrl: () => string;
    getSystemContractsListUrl: () => string;
    getSystemToken: () => TokenClass;
    getExplorerUrl: () => string;
    getSmallLogoPath: () => string;
    getLargeLogoPath: () => string;
    getIndexerApiEndpoint: () => string;
    getTrustedContractsBucket(): string;
    isTestnet: () => boolean;
    getThemes: () => Themes;
    getSocialLinks: () => SocialLink[];
    getFooterLinks: () => FooterLinksConfig;
    getHeaderIndicators: () => HeaderIndicators;
    getHeaderMenuConfig: () => HeaderMenuConfig;
    hasIndexerSupportOver(version:string): boolean;
    // Telos Specific
    getEthAccountByNativeAccount: (account: string) => Promise<string>;
    getNativeSupport(): TelosEvmApi | null;
    getIndexerApi(): AxiosInstance;
    getTelosApi(): AxiosInstance;
    getHyperionApi(): AxiosInstance;
    getContractManager(): ContractManager;
    getUAL(): UAL | null;
    getMonitorUrl(): string;
    indexerHealthState: IndexerHealthResponse;
    indexerReady$: Observable<boolean>;
}

export const evmSettings: { [network: string]: TeloscanEVMChainSettings } = {
    'telos-zkevm-testnet': new TelosZkEVM('telos-zkevm-testnet'),
    'telos-evm': new TelosEVM('telos-evm'),
    'telos-evm-testnet': new TelosEVMTestnet('telos-evm-testnet'),
};

export const chains: { [network: string]: ChainModel } = {};

export interface ChainModel {
    settings: TeloscanEVMChainSettings;
    themes: Themes;
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
        themes: {
            light: {
            } as Theme,
            dark: {
            } as Theme,
        } as Themes,
    } as unknown as ChainModel;
    if (!isNative) {
        (model as unknown as EvmChainModel).gasPrice = ethers.constants.Zero;
    }
    return model;
};

const current = {};

const ChainStore = {
    currentChain: current as unknown as ChainModel,
    loggedChain: current as unknown as ChainModel,
    loggedEvmChain: current as unknown as ChainModel,
    getNetworkSettings: (network: string) => ChainStore.currentChain.settings,
    getChain: (label: string) => ChainStore.currentChain,
    setChain: (label: string, network: string) => {
        if (network in evmSettings) {

            // create the chain model if it doesn't exist
            if (!chains[network]) {
                chains[network] = newChainModel(network, false);
            }

            // make the change only if they are different
            if (network !== ChainStore?.currentChain?.settings?.getNetwork()) {
                const current = chains[network];
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
