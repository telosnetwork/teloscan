/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
// Mocking EVMStore -----------------------------------
import { ethers } from 'ethers';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { EVMChainSettings, useChainStore, useFeedbackStore } from 'src/antelope/mocks/index';
import { createTraceFunction } from 'src/antelope/mocks/FeedbackStore';
import { AntelopeError, ExceptionError } from 'src/antelope/wallets/types';
import { RpcEndpoint } from 'universal-authenticator-library';



class EVMStore {
    trace: (action: string, ...args: unknown[]) => void;

    constructor() {
        this.trace = createTraceFunction('EVMStore');
    }

    async switchChainInjected(InjectedProvider: ethers.providers.ExternalProvider): Promise<boolean> {
        this.trace('switchChainInjected', [InjectedProvider]);
        useFeedbackStore().setLoading('evm.switchChainInjected');
        const provider = InjectedProvider;
        if (provider) {
            const chainSettings = useChainStore().loggedChain.settings as unknown as EVMChainSettings;
            const chainId = parseInt(chainSettings.getChainId(), 10);
            const chainIdParam = `0x${chainId.toString(16)}`;
            if (!provider.request) {
                useFeedbackStore().unsetLoading('evm.switchChainInjected');
                throw new AntelopeError('antelope.evm.error_support_provider_request');
            }
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainIdParam }],
                });
                return true;
            } catch (error) {
                const chainNotAddedCodes = [
                    4902,
                    -32603, // https://github.com/MetaMask/metamask-mobile/issues/2944
                ];

                if (chainNotAddedCodes.includes((error as unknown as ExceptionError).code)) {  // 'Chain <hex chain id> hasn't been added'
                    const p:RpcEndpoint = chainSettings.getRPCEndpoint();
                    const rpcUrl = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
                    try {
                        if (!provider.request) {
                            throw new AntelopeError('antelope.evm.error_support_provider_request');
                        }
                        const payload = {
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: chainIdParam,
                                chainName: chainSettings.getDisplay(),
                                nativeCurrency: {
                                    name: chainSettings.getSystemToken().name,
                                    symbol: chainSettings.getSystemToken().symbol,
                                    decimals: chainSettings.getSystemToken().decimals,
                                },
                                rpcUrls: [rpcUrl],
                                blockExplorerUrls: [chainSettings.getExplorerUrl()],
                                iconUrls: [chainSettings.getSmallLogoPath(), chainSettings.getLargeLogoPath()],
                            }],
                        };
                        await provider.request(payload);
                        return true;
                    } catch (e) {
                        if ((e as unknown as ExceptionError).code === 4001) {
                            throw new AntelopeError('antelope.evm.error_add_chain_rejected');
                        } else {
                            console.error('Error:', e);
                            throw new AntelopeError('antelope.evm.error_add_chain');
                        }
                    }
                } else if ((error as unknown as ExceptionError).code === 4001) {
                    throw new AntelopeError('antelope.evm.error_switch_chain_rejected');
                } else {
                    console.error('Error:', error);
                    throw new AntelopeError('antelope.evm.error_switch_chain');
                }
            } finally {
                useFeedbackStore().unsetLoading('evm.switchChainInjected');
            }
        } else {
            useFeedbackStore().unsetLoading('evm.switchChainInjected');
            throw new AntelopeError('antelope.evm.error_no_provider');
        }
    }

    async isProviderOnTheCorrectChain(provider: ethers.providers.Web3Provider, correctChainId: string): Promise<boolean> {
        const { chainId } = await provider.getNetwork();
        const response = Number(chainId).toString() === correctChainId;
        this.trace('isProviderOnTheCorrectChain', provider, ' -> ', response);
        return response;
    }

    async ensureCorrectChain(authenticator: EVMAuthenticator): Promise<ethers.providers.Web3Provider> {
        this.trace('ensureCorrectChain', authenticator);
        const checkProvider = await authenticator.web3Provider();
        let response = checkProvider;
        const correctChainId = useChainStore().currentChain.settings.getChainId();
        if (!await this.isProviderOnTheCorrectChain(checkProvider, correctChainId)) {
            const provider = await authenticator.externalProvider();
            await this.switchChainInjected(provider);
            response = new ethers.providers.Web3Provider(provider);
        }
        return response;
    }
}

export const useEVMStore = () => new EVMStore();
