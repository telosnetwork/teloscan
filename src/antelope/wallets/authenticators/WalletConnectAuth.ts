/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable max-len */
import {
    PrepareSendTransactionResult,
    PrepareWriteContractResult,
    SendTransactionResult,
    sendTransaction,
    disconnect,
    InjectedConnector,
    fetchBalance,
    getAccount,
    prepareSendTransaction,
    prepareWriteContract,
    writeContract,
    WriteContractResult,
} from '@wagmi/core';
import {
    EthereumClient,
} from '@web3modal/ethereum';
import { Web3Modal, Web3ModalConfig } from '@web3modal/html';
import { BigNumber, ethers } from 'ethers';
import { useChainStore } from 'src/antelope';
import { useContractStore } from 'src/antelope';
import { useFeedbackStore } from 'src/antelope';
import { usePlatformStore } from 'src/antelope';
import {
    AntelopeError,
    EvmABI,
    EvmFunctionParam,
    TokenClass,
    addressString,
    erc20Abi,
    escrowAbiWithdraw,
    stlosAbiDeposit,
    stlosAbiWithdraw,
    wtlosAbiDeposit,
    wtlosAbiWithdraw,
} from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { RpcEndpoint } from 'universal-authenticator-library';
import { toRaw } from 'vue';
import { TELOS_ANALYTICS_EVENT_NAMES, TELOS_NETWORK_NAMES } from 'src/antelope/mocks/chain-constants';

const name = 'WalletConnect';

export class WalletConnectAuth extends EVMAuthenticator {
    // debounce methods do not allow for async functions to be awaited; they return a promise which resolves immediately
    // thus, we need to implement out own debounce so that we can await the async function (in this case, _prepareTokenForTransfer)
    private _debounceTimer = setTimeout(() => {}, 0);
    private _debouncedPrepareTokenConfigResolver: ((value: unknown) => void) | null;
    private web3Modal: Web3Modal;
    private unsubscribeWeb3Modal: null | (() => void) = null;
    private usingQR = false;

    options: Web3ModalConfig;
    wagmiClient: EthereumClient;
    // this is just a dummy label to identify the authenticator base class
    constructor(options: Web3ModalConfig, wagmiClient: EthereumClient, label = name) {
        super(label);
        this.options = options;
        this.wagmiClient = wagmiClient;
        this._debouncedPrepareTokenConfigResolver = null;

        console.log('this.options, this.wagmiClient', this.options, this.wagmiClient);

        this.web3Modal = new Web3Modal(this.options, this.wagmiClient);
    }

    // EVMAuthenticator API ----------------------------------------------------------

    getName(): string {
        return name;
    }

    // this is the important instance creation where we define a label to assign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        return new WalletConnectAuth(this.options, this.wagmiClient, label);
    }

    async walletConnectLogin(network: string, trackAnalyticsEvents: boolean): Promise<addressString | null> {
        this.trace('walletConnectLogin');
        const chainSettings = this.getChainSettings();
        const isOnTelos = TELOS_NETWORK_NAMES.includes(chainSettings.getNetwork());

        try {
            this.clearAuthenticator();
            const address = getAccount().address as addressString;

            // We are successfully logged in. Let's find out if we are using QR
            this.usingQR = false;
            const injected = new InjectedConnector();
            const provider = toRaw(await injected.getProvider());
            if (typeof provider === 'undefined') {
                this.usingQR = true;
            } else {
                const providerAddress = (provider._state?.accounts) ? provider._state?.accounts[0] : '';
                const sameAddress = providerAddress.toLocaleLowerCase() === address.toLocaleLowerCase();
                this.usingQR = !sameAddress;
                this.trace('walletConnectLogin', 'providerAddress:', providerAddress, 'address:', address, 'sameAddress:', sameAddress);
            }
            this.trace('walletConnectLogin', 'using QR:', this.usingQR);

            // We are already logged in. Now let's try to force the wallet to connect to the correct network
            try {
                if (!usePlatformStore().isMobile) {
                    await super.login(network);
                }
            } catch (e) {
                // we are already logged in. So we just ignore the error
                console.error(e);
            }

            if (isOnTelos && trackAnalyticsEvents) {
                this.trace(
                    'login',
                    'trackAnalyticsEvent -> login successful',
                    'WalletConnect',
                    TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulWalletConnect,
                );
                chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulWalletConnect);
                this.trace(
                    'login',
                    'trackAnalyticsEvent -> generic login successful',
                    TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful,
                );
                chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful);
            }

            return address;
        } catch (e) {
            // This is a non-expected error
            console.error(e);
            if (isOnTelos && trackAnalyticsEvents) {
                this.trace(
                    'walletConnectLogin',
                    'trackAnalyticsEvent -> login failed',
                    'WalletConnect',
                    TELOS_ANALYTICS_EVENT_NAMES.loginFailedWalletConnect,
                );
                const chainSettings = this.getChainSettings();
                chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginFailedWalletConnect);
            }
            throw new AntelopeError('antelope.evm.error_login');
        } finally {
            useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        }
    }

    async login(network: string, trackAnalyticsEvents: boolean): Promise<addressString | null> {
        this.trace('login', network);
        const wagmiConnected = () => localStorage.getItem('wagmi.connected');
        const chainSettings = this.getChainSettings();
        const isOnTelos = TELOS_NETWORK_NAMES.includes(chainSettings.getNetwork());

        useFeedbackStore().setLoading(`${this.getName()}.login`);
        if (wagmiConnected()) {
            // We are in auto-login process. So log loginStarted before calling the walletConnectLogin method
            if (isOnTelos && trackAnalyticsEvents) {
                this.trace(
                    'login',
                    'trackAnalyticsEvent -> login started',
                    'WalletConnect',
                    TELOS_ANALYTICS_EVENT_NAMES.loginStarted,
                );
                chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginStarted);
            }
            return this.walletConnectLogin(network, trackAnalyticsEvents);
        } else {
            return new Promise((resolve) => {
                this.trace('login', 'web3Modal.openModal()');

                this.unsubscribeWeb3Modal = this.web3Modal.subscribeModal(async (newState: {open:boolean}) => {
                    this.trace('login', 'web3Modal.subscribeModal ', toRaw(newState), wagmiConnected);

                    if (isOnTelos && newState.open === true && trackAnalyticsEvents) {
                        this.trace(
                            'login',
                            'trackAnalyticsEvent -> login started',
                            'WalletConnect',
                            TELOS_ANALYTICS_EVENT_NAMES.loginStarted,
                        );
                        chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginStarted);
                    }

                    if (newState.open === false) {
                        useFeedbackStore().unsetLoading(`${this.getName()}.login`);

                        if (isOnTelos && !wagmiConnected() && trackAnalyticsEvents) {
                            this.trace(
                                'login',
                                'trackAnalyticsEvent -> login failed',
                                'WalletConnect',
                                TELOS_ANALYTICS_EVENT_NAMES.loginFailedWalletConnect,
                            );
                            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginFailedWalletConnect);
                        }

                        // this prevents multiple subscribers from being attached to the web3Modal
                        // without this, every time the user logs out and back in again, this subscribeModal handler
                        // runs one more time than the last time
                        if (this.unsubscribeWeb3Modal) {
                            this.unsubscribeWeb3Modal();
                        }
                    }

                    if (wagmiConnected()) {
                        resolve(this.walletConnectLogin(network, true));
                    }
                });
                this.web3Modal.openModal();
            });
        }
    }

    // having this two properties attached to the authenticator instance may bring some problems
    // so after we use them we need to clear them to avoid that problems
    clearAuthenticator(): void {
        this.trace('clearAuthenticator');
        this.usingQR = false;
        this.options = null as unknown as Web3ModalConfig;
        this.wagmiClient = null as unknown as EthereumClient;
    }

    async logout(): Promise<void> {
        this.trace('logout');
        if (localStorage.getItem('wagmi.connected')){
            await disconnect();
        }
    }

    async getSystemTokenBalance(address: addressString): Promise<BigNumber> {
        this.trace('getSystemTokenBalance', address);
        const chainId = +useChainStore().getChain(this.label).settings.getChainId();
        const balanceBn = await fetchBalance({ address, chainId });
        return BigNumber.from(balanceBn.value);
    }

    async getERC20TokenBalance(address: addressString, token: addressString): Promise<BigNumber> {
        this.trace('getERC20TokenBalance', [address, token]);
        const chainId = +useChainStore().getChain(this.label).settings.getChainId();
        const balance = await fetchBalance({ address, chainId, token }).then(balanceBn => balanceBn.value);
        return BigNumber.from(balance);
    }

    async signCustomTransaction(contract: string, abi: EvmABI, parameters: EvmFunctionParam[], value?: BigNumber): Promise<WriteContractResult> {
        this.trace('signCustomTransaction', contract, [abi], parameters, value?.toString());

        const method = abi[0].name;
        if (abi.length > 1) {
            console.warn(
                `signCustomTransaction: abi contains more than one function,
                we assume the first one (${method}) is the one to be called`,
            );
        }

        const chainSettings = this.getChainSettings();

        const config = {
            chainId: +chainSettings.getChainId(),
            address: contract,
            abi: abi,
            functionName: method,
            args: parameters,
        } as {
            chainId: number;
            address: addressString;
            abi: EvmABI;
            functionName: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            args: any[];
            value?: bigint;
        };

        if (value) {
            config.value = BigInt(value.toString());
        }

        this.trace('signCustomTransaction', 'prepareWriteContract ->', config);
        const sendConfig = await prepareWriteContract(config);

        this.trace('signCustomTransaction', 'writeContract ->', sendConfig);
        return await writeContract(sendConfig);
    }


    async transferTokens(token: TokenClass, amount: BigNumber, to: addressString): Promise<SendTransactionResult | WriteContractResult> {
        this.trace('transferTokens', token, amount, to);
        if (!this.sendConfig) {
            throw new AntelopeError(token.isSystem ?
                'antelope.wallets.error_system_token_transfer_config' :
                'antelope.wallets.error_token_transfer_config',
            );
        } else {
            if (token.isSystem) {
                return await sendTransaction(this.sendConfig as PrepareSendTransactionResult);
            } else {
                // prepare variables
                const value = amount.toHexString();
                const transferAbi = erc20Abi.filter(abi => abi.name === 'transfer');

                return this.signCustomTransaction(
                    token.address,
                    transferAbi,
                    [to, value],
                );
            }
        }
    }

    readyForTransfer(): boolean {
        return !!this.sendConfig;
    }

    sendConfig: PrepareSendTransactionResult | PrepareWriteContractResult<EvmABI, string, number> | null = null;
    private _debouncedPrepareTokenConfig(token: TokenClass | null, amount: BigNumber, to: string) {
        // If there is already a pending call, clear it
        if (this._debouncedPrepareTokenConfigResolver) {
            clearTimeout(this._debounceTimer);
            this._debouncedPrepareTokenConfigResolver(null); // Resolve with null when debounced
        }

        // Create a new promise for this call
        const promise = new Promise((resolve) => {
            this._debouncedPrepareTokenConfigResolver = resolve;
        });

        // Set a timer to call the function after the delay
        this._debounceTimer = setTimeout(async () => {
            clearTimeout(this._debounceTimer);
            const result = await this._prepareTokenForTransfer(token, amount, to); // Call the function

            if (this._debouncedPrepareTokenConfigResolver) {
                this._debouncedPrepareTokenConfigResolver(result); // Resolve the promise with the result
            }
        }, 500);

        // Return the promise
        return promise;
    }
    async _prepareTokenForTransfer(token: TokenClass | null, amount: BigNumber, to: string) {
        this.trace('prepareTokenForTransfer', [token], amount, to);
        if (token) {
            if (token.isSystem) {
                this.sendConfig = await prepareSendTransaction({
                    to,
                    value: BigInt(amount.toString()),
                    chainId: +useChainStore().getChain(this.label).settings.getChainId(),
                });
            } else {
                const abi = useContractStore().getTokenABI(token.type);
                const functionName = 'transfer';
                this.sendConfig = await prepareWriteContract({
                    chainId: +useChainStore().getChain(this.label).settings.getChainId(),
                    address: token.address as addressString,
                    abi,
                    functionName,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    args: [to, amount] as any[],
                });
            }
        } else {
            this.sendConfig = null;
        }
    }

    async prepareTokenForTransfer(token: TokenClass | null, amount: BigNumber, to: string): Promise<void> {
        this.sendConfig = null;
        await this._debouncedPrepareTokenConfig(token, amount, to);
    }

    async wrapSystemToken(amount: BigNumber): Promise<WriteContractResult> {
        this.trace('wrapSystemToken', amount);

        // prepare variables
        const chainSettings = this.getChainSettings();
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address as addressString;

        return this.signCustomTransaction(
            wrappedSystemTokenContractAddress,
            wtlosAbiDeposit,
            [],
            amount,
        );
    }

    async unwrapSystemToken(amount: BigNumber): Promise<WriteContractResult> {
        this.trace('unwrapSystemToken', amount);

        // prepare variables
        const chainSettings = this.getChainSettings();
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address as addressString;

        return this.signCustomTransaction(
            wrappedSystemTokenContractAddress,
            wtlosAbiWithdraw,
            [amount.toString()],
        );
    }

    async stakeSystemTokens(amount: BigNumber): Promise<WriteContractResult> {
        this.trace('stakeSystemTokens', amount);

        // prepare variables
        const chainSettings = this.getChainSettings();
        const stakedSystemTokenContractAddress = chainSettings.getStakedSystemToken().address as addressString;

        return this.signCustomTransaction(
            stakedSystemTokenContractAddress,
            stlosAbiDeposit,
            [],
            amount,
        );
    }

    async unstakeSystemTokens(amount: BigNumber): Promise<WriteContractResult> {
        this.trace('unstakeSystemTokens', amount);

        // prepare variables
        const chainSettings = this.getChainSettings();
        const stakedSystemTokenContractAddress = chainSettings.getStakedSystemToken().address as addressString;
        const address = this.getAccountAddress();

        return this.signCustomTransaction(
            stakedSystemTokenContractAddress,
            stlosAbiWithdraw,
            [amount.toString(), address, address],
        );
    }

    async withdrawUnstakedTokens(): Promise<WriteContractResult> {
        this.trace('withdrawUnstakedTokens');

        // prepare variables
        const chainSettings = this.getChainSettings();
        const escrowContractAddress = chainSettings.getEscrowContractAddress();

        return this.signCustomTransaction(
            escrowContractAddress,
            escrowAbiWithdraw,
            [],
        );
    }

    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);

        if (usePlatformStore().isMobile) {
            this.trace('isConnectedTo', 'mobile -> true');
            return true;
        }

        return new Promise(async (resolve) => {
            const web3Provider = await this.web3Provider();
            const correct = +web3Provider.network.chainId === +chainId;
            this.trace('isConnectedTo', chainId, correct ? 'OK!' : 'not connected');
            resolve(correct);
        });
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        let web3Provider = null;
        if (usePlatformStore().isMobile || this.usingQR) {
            const p:RpcEndpoint = this.getChainSettings().getRPCEndpoint();
            const url = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
            web3Provider = new ethers.providers.JsonRpcProvider(url);
            this.trace('web3Provider', 'JsonRpcProvider ->', web3Provider);

            // This is a hack to make the QR code work.
            // this code is going to be used in EVMAuthenticator.ts login method
            const listAccounts: () => Promise<`0x${string}`[]> = async () => [getAccount().address as addressString];
            web3Provider.listAccounts = listAccounts;

        } else {
            web3Provider = new ethers.providers.Web3Provider(await this.externalProvider());
            this.trace('web3Provider', 'Web3Provider ->', web3Provider);
        }
        await web3Provider.ready;
        return web3Provider as ethers.providers.Web3Provider;
    }

    async getSigner(): Promise<ethers.Signer> {
        this.trace('getSigner');
        const web3Provider = await this.web3Provider();
        const signer = web3Provider.getSigner();
        this.trace('getSigner', 'signer ->', signer);
        return signer;
    }

    async externalProvider(): Promise<ethers.providers.ExternalProvider> {
        this.trace('externalProvider');
        return new Promise(async (resolve) => {
            const injected = new InjectedConnector();
            const provider = toRaw(await injected.getProvider());
            if (!provider) {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
            resolve(provider as unknown as ethers.providers.ExternalProvider);
        });
    }

    async ensureCorrectChain(): Promise<ethers.providers.Web3Provider> {
        this.trace('ensureCorrectChain', 'QR:', this.usingQR);
        if (this.usingQR) {
            // we don't have tools to check the chain when using QR
            return this.web3Provider();
        } else {
            return super.ensureCorrectChain();
        }
    }

}
