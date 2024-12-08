/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
// EVMAuthenticator class

import { SendTransactionResult, WriteContractResult } from '@wagmi/core';
import { BigNumber, ethers } from 'ethers';
import { createTraceFunction } from 'src/antelope/mocks/FeedbackStore';
import { CURRENT_CONTEXT, getAntelope, useAccountStore } from 'src/antelope/mocks';
import { EVMChainSettings } from 'src/antelope/mocks';
import { useChainStore } from 'src/antelope/mocks';
import { useEVMStore } from 'src/antelope/mocks';
import { isTracingAll, useFeedbackStore } from 'src/antelope/mocks/FeedbackStore';
import { usePlatformStore } from 'src/antelope/mocks';
import { AntelopeError, EvmABI, EvmFunctionParam, EvmTransactionResponse, ExceptionError, TokenClass, addressString } from 'src/antelope/types';

export abstract class EVMAuthenticator {

    readonly label: string;
    readonly trace: (message: string, ...args: unknown[]) => void;

    constructor(label: string) {
        this.label = label;
        const name = `${this.getName()}(${label})`;
        this.trace = createTraceFunction(name);
        useFeedbackStore().setDebug(name, isTracingAll());
    }
    abstract getName(): string;
    abstract logout(): Promise<void>;
    abstract getSystemTokenBalance(address: addressString | string): Promise<BigNumber>;
    abstract getERC20TokenBalance(address: addressString | string, tokenAddress: addressString | string): Promise<BigNumber>;
    abstract signCustomTransaction(contract: string, abi: EvmABI, parameters: EvmFunctionParam[], value?: BigNumber): Promise<EvmTransactionResponse | WriteContractResult>;
    abstract transferTokens(token: TokenClass, amount: BigNumber, to: addressString | string): Promise<EvmTransactionResponse | SendTransactionResult | WriteContractResult>;
    abstract prepareTokenForTransfer(token: TokenClass | null, amount: BigNumber, to: string): Promise<void>;
    abstract wrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse | WriteContractResult>;
    abstract unwrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse | WriteContractResult>;
    abstract stakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse | WriteContractResult>;
    abstract unstakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse | WriteContractResult>;
    abstract withdrawUnstakedTokens(): Promise<EvmTransactionResponse | WriteContractResult>;
    abstract isConnectedTo(chainId: string): Promise<boolean>;
    abstract externalProvider(): Promise<ethers.providers.ExternalProvider>;
    abstract web3Provider(): Promise<ethers.providers.Web3Provider>;
    abstract getSigner(): Promise<ethers.Signer>;

    // to easily clone the authenticator
    abstract newInstance(label: string): EVMAuthenticator;

    // indicates the authenticator is ready to transfer tokens
    readyForTransfer(): boolean {
        return true;
    }

    // returns the associated account address acording to the label
    getAccountAddress(): addressString {
        return useAccountStore().getAccount(this.label).account as addressString;
    }

    // returns the associated chain settings acording to the label
    getChainSettings(): EVMChainSettings {
        return (useChainStore().getChain(this.label).settings as EVMChainSettings);
    }

    async login(network: string, trackAnalyticsEvents?: boolean): Promise<addressString | null> {
        this.trace('login', network);
        this.trace('Login analytics enabled =', trackAnalyticsEvents);

        const chain = useChainStore();
        try {
            chain.setChain(CURRENT_CONTEXT, network);

            const checkProvider = await this.ensureCorrectChain() as ethers.providers.Web3Provider;

            const accounts = await checkProvider.listAccounts();
            if (accounts.length > 0) {
                return accounts[0] as addressString;
            } else {
                if (!checkProvider.provider.request) {
                    throw new AntelopeError('antelope.evm.error_support_provider_request');
                }
                const accessGranted = await checkProvider.provider.request({ method: 'eth_requestAccounts' });
                if (accessGranted.length < 1) {
                    return null;
                }
                return accessGranted[0] as addressString;
            }
        } catch (error) {
            if ((error as unknown as ExceptionError).code === 4001) {
                throw new AntelopeError('antelope.evm.error_connect_rejected');
            } else {
                console.error('Error:', error);
                throw new AntelopeError('antelope.evm.error_login');
            }
        }
    }

    async autoLogin(network: string, account: string, trackAnalyticsEvents?: boolean): Promise<addressString> {
        this.trace('autoLogin', network, account);
        this.trace('AutoLogin analytics enabled =', trackAnalyticsEvents);

        const chain = useChainStore();
        try {
            chain.setChain(CURRENT_CONTEXT, network);
            return account as addressString;
        } catch (error) {
            if ((error as unknown as ExceptionError).code === 4001) {
                throw new AntelopeError('antelope.evm.error_connect_rejected');
            } else {
                console.error('Error:', error);
                throw new AntelopeError('antelope.evm.error_login');
            }
        }
    }

    async ensureCorrectChain(): Promise<ethers.providers.Web3Provider> {
        this.trace('ensureCorrectChain');
        if (usePlatformStore().isMobile) {
            // we don't have tools to check the chain on mobile
            return useEVMStore().ensureCorrectChain(this);
        } else {
            const showSwitchNotification = !(await this.isConnectedToCorrectChain());
            return useEVMStore().ensureCorrectChain(this).then((result) => {
                if (showSwitchNotification) {
                    const ant = getAntelope();
                    const networkName = useChainStore().getChain(this.label).settings.getDisplay();
                    ant.config.notifyNeutralMessageHandler(
                        ant.config.localizationHandler('antelope.wallets.network_switch_success', { networkName }),
                    );
                }
                return result;
            });
        }
    }

    isConnectedToCorrectChain(): Promise<boolean> {
        const correctChainId = useChainStore().getChain(this.label).settings.getChainId();
        return this.isConnectedTo(correctChainId);
    }
}
