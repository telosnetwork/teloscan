/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
// Mocking EVMStore -----------------------------------
import { ethers } from 'ethers';
import { EVMAuthenticator, InjectedProviderAuth } from 'src/antelope/wallets';
import { createTraceFunction } from 'src/antelope/mocks/FeedbackStore';
import { EVMChainSettings, useChainStore, useFeedbackStore, useAccountStore } from 'src/antelope/mocks';
import { AntelopeError, EthereumProvider, ExceptionError } from 'src/antelope/types';
import { RpcEndpoint } from 'universal-authenticator-library';

class EVMStore {
    trace: (action: string, ...args: unknown[]) => void;

    constructor() {
        this.trace = createTraceFunction('EVMStore');
    }

    // actions ---
    async initInjectedProvider(authenticator: InjectedProviderAuth): Promise<void> {
        this.trace('initInjectedProvider', authenticator.getName(), [authenticator.getProvider()]);
        const provider: EthereumProvider | null = authenticator.getProvider();
        const evm = useEVMStore();

        if (provider && !provider.__initialized) {
            this.trace('initInjectedProvider', authenticator.getName(), 'initializing provider');
            // ensure this provider actually has the correct methods
            // Check consistency of the provider
            const methods = ['request', 'on'];
            const candidate = provider as unknown as Record<string, unknown>;
            for (const method of methods) {
                if (typeof candidate[method] !== 'function') {
                    console.warn(`MetamaskAuth.getProvider: method ${method} not found`);
                    throw new AntelopeError('antelope.evm.error_invalid_provider');
                }
            }

            provider.on('accountsChanged', async (value) => {
                const accounts = value as string[];
                const network = useChainStore().currentChain.settings.getNetwork();
                evm.trace('provider.accountsChanged', ...accounts);

                if (accounts.length > 0) {
                    // If we are here one of two possible things had happened:
                    // 1. The user has just logged in to the wallet
                    // 2. The user has switched the account in the wallet

                    // if we are in case 1, then we are in the middle of the login process and we don't need to do anything
                    // We can tell because the account store has no logged account

                    // But if we are in case 2 and have a logged account, we need to re-login the account using the same authenticator
                    // overwriting the previous logged account, which in turn will trigger all account data to be reloaded
                    if (useAccountStore().loggedAccount) {
                        // if the user is already authenticated we try to re login the account using the same authenticator
                        const authenticator = useAccountStore().loggedAccount.authenticator as EVMAuthenticator;
                        if (!authenticator) {
                            console.error('Inconsistency: logged account authenticator is null', authenticator);
                        } else {
                            useAccountStore().loginEVM({ authenticator,  network }, false);
                        }
                    }
                } else {
                    // the user has disconnected the all the accounts from the wallet so we logout
                    useAccountStore().logout();
                }
            });

            // This initialized property is not part of the standard provider, it's just a flag to know if we already initialized the provider
            provider.__initialized = true;
            evm.addInjectedProvider(authenticator);
        }
        authenticator.onReady.next(true);
    }

    addInjectedProvider(authenticator: InjectedProviderAuth) {
        this.trace('addInjectedProvider', authenticator.getName());
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
        const response = +chainId === +correctChainId;
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
