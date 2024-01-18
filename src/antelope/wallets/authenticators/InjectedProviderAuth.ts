/* eslint-disable max-len */


import { BigNumber, ethers } from 'ethers';
import { BehaviorSubject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { useEVMStore, useFeedbackStore } from 'src/antelope';
import {
    AntelopeError,
    EthereumProvider,
    EvmABI,
    EvmFunctionParam,
    EvmTransactionResponse,
    TokenClass,
    addressString,
    erc20Abi,
    escrowAbiWithdraw,
    stlosAbiDeposit,
    stlosAbiWithdraw,
    wtlosAbiDeposit,
    wtlosAbiWithdraw,
} from 'src/antelope/types';
import { BraveAuthName, EVMAuthenticator, MetamaskAuthName, SafePalAuthName } from 'src/antelope/wallets';
import { TELOS_ANALYTICS_EVENT_NAMES, TELOS_NETWORK_NAMES } from 'src/antelope/mocks/chain-constants';

export abstract class InjectedProviderAuth extends EVMAuthenticator {
    onReady = new BehaviorSubject<boolean>(false);

    // this is just a dummy label to identify the authenticator base class
    constructor(label: string) {
        super(label);
        useEVMStore().initInjectedProvider(this);
    }
    abstract getProvider(): EthereumProvider | null;

    async getSigner(): Promise<ethers.Signer> {
        const web3Provider = await this.web3Provider();
        return web3Provider.getSigner();
    }

    async ensureInitializedProvider(): Promise<ethers.providers.ExternalProvider> {
        return new Promise((resolve, reject) => {
            this.onReady.asObservable().pipe(
                filter(ready => ready),
                map(() => this.getProvider()),
            ).subscribe((provider) => {
                if (provider) {
                    resolve(provider);
                } else {
                    reject(new AntelopeError('antelope.evm.error_no_provider'));
                }
            });
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleCatchError(error: any): AntelopeError {
        if ('ACTION_REJECTED' === ((error as {code:string}).code)) {
            return new AntelopeError('antelope.evm.error_transaction_canceled');
        } else {
            // unknown error we print on console
            console.error(error);
            return new AntelopeError('antelope.evm.error_send_transaction', { error });
        }
    }

    // this action is used by MetamaskAuth.transferTokens()
    async sendSystemToken(to: string, value: ethers.BigNumber): Promise<EvmTransactionResponse> {
        this.trace('sendSystemToken', to, value);

        // Send the transaction
        return (await this.getSigner()).sendTransaction({
            to,
            value,
        }).then(
            (transaction: ethers.providers.TransactionResponse) => transaction,
        ).catch((error) => {
            throw this.handleCatchError(error);
        });
    }

    // EVMAuthenticator API ----------------------------------------------------------

    async signCustomTransaction(contract: string, abi: EvmABI, parameters: EvmFunctionParam[], value?: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('signCustomTransaction', contract, [abi], parameters, value?.toString());

        const method = abi[0].name;
        if (abi.length > 1) {
            console.warn(
                `signCustomTransaction: abi contains more than one function,
                we assume the first one (${method}) is the one to be called`,
            );
        }

        const signer = await this.getSigner();
        const contractInstance = new ethers.Contract(contract, abi, signer);
        const transaction = await contractInstance[method](...parameters, { value });
        return transaction;
    }

    async wrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('wrapSystemToken', amount.toString());
        // prepare variables
        const chainSettings = this.getChainSettings();
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address as addressString;

        return this.signCustomTransaction(
            wrappedSystemTokenContractAddress,
            wtlosAbiDeposit,
            [],
            amount,
        ).catch((error) => {
            throw this.handleCatchError(error);
        });
    }

    async unwrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('unwrapSystemToken', amount.toString());

        // prepare variables
        const chainSettings = this.getChainSettings();
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address as addressString;
        const value = amount.toHexString();

        return this.signCustomTransaction(
            wrappedSystemTokenContractAddress,
            wtlosAbiWithdraw,
            [value],
        ).catch((error) => {
            throw this.handleCatchError(error);
        });
    }

    async login(network: string, trackAnalyticsEvents?: boolean): Promise<addressString | null> {
        const chainSettings = this.getChainSettings();
        const authName = this.getName();
        const isTelos = TELOS_NETWORK_NAMES.includes(network);

        this.trace('login', network);
        useFeedbackStore().setLoading(`${this.getName()}.login`);

        if (isTelos && trackAnalyticsEvents) {
            this.trace('login', 'trackAnalyticsEvent -> login started');
            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginStarted);
        }

        const response = await super.login(network, trackAnalyticsEvents).then((res) => {
            if (isTelos && trackAnalyticsEvents && TELOS_NETWORK_NAMES.includes(network)) {
                let successfulLoginEventName = '';

                if (authName === MetamaskAuthName) {
                    successfulLoginEventName = TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulMetamask;
                } else if (authName === SafePalAuthName) {
                    successfulLoginEventName = TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulSafepal;
                } else if (authName === BraveAuthName) {
                    successfulLoginEventName = TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulBrave;
                }

                if (successfulLoginEventName) {
                    this.trace('login', 'trackAnalyticsEvent -> login succeeded', authName, successfulLoginEventName);
                    chainSettings.trackAnalyticsEvent(successfulLoginEventName);
                }

                this.trace('login', 'trackAnalyticsEvent -> generic login succeeded', TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful);
                chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful);
            }

            return res;
        }).catch((error) => {
            // if the user rejects the connection, we don't want to track it as an error
            if (
                trackAnalyticsEvents &&
                isTelos &&
                error.message !== 'antelope.evm.error_connect_rejected'
            ) {
                let failedLoginEventName = '';

                if (authName === MetamaskAuthName) {
                    failedLoginEventName = TELOS_ANALYTICS_EVENT_NAMES.loginFailedMetamask;
                } else if (authName === SafePalAuthName) {
                    failedLoginEventName = TELOS_ANALYTICS_EVENT_NAMES.loginFailedSafepal;
                } else if (authName === BraveAuthName) {
                    failedLoginEventName = TELOS_ANALYTICS_EVENT_NAMES.loginFailedBrave;
                }

                if (failedLoginEventName) {
                    this.trace('login', 'trackAnalyticsEvent -> login failed', authName, failedLoginEventName);
                    chainSettings.trackAnalyticsEvent(failedLoginEventName);
                }
            }
        }).finally(() => {
            useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        });

        return response ?? null;
    }

    async logout(): Promise<void> {
        this.trace('logout');
    }

    async getSystemTokenBalance(address: addressString | string): Promise<ethers.BigNumber> {
        this.trace('getSystemTokenBalance', address);
        const provider = await this.web3Provider();
        if (provider) {
            return provider.getBalance(address);
        } else {
            throw new AntelopeError('antelope.evm.error_no_provider');
        }
    }

    async getERC20TokenBalance(address: addressString, token: addressString): Promise<ethers.BigNumber> {
        this.trace('getERC20TokenBalance', [address, token]);
        try {
            const provider = await this.web3Provider();
            if (provider) {
                const erc20Contract = new ethers.Contract(token, erc20Abi, provider);
                const balance = await erc20Contract.balanceOf(address);
                return balance;
            } else {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
        } catch (e) {
            console.error('getERC20TokenBalance', e, address, token);
            throw e;
        }
    }

    async transferTokens(token: TokenClass, amount: ethers.BigNumber, to: addressString): Promise<EvmTransactionResponse> {
        this.trace('transferTokens', token, amount, to);
        if (token.isSystem) {
            return this.sendSystemToken(to, amount);
        } else {
            const value = amount.toHexString();
            const transferAbi = erc20Abi.filter(abi => abi.name === 'transfer');
            return this.signCustomTransaction(
                token.address,
                transferAbi,
                [to, value],
            );
        }
    }

    prepareTokenForTransfer(token: TokenClass | null, amount: ethers.BigNumber, to: string): Promise<void> {
        this.trace('prepareTokenForTransfer', [token], amount, to);
        return new Promise((resolve) => {
            resolve();
        });
    }

    /**
     * This method creates a Transaction to stake system tokens
     * @param amount amount of system tokens to stake
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async stakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('stakeSystemTokens', amount.toString());

        // prepare variables
        const chainSettings = this.getChainSettings();
        const stakedSystemTokenContractAddress = chainSettings.getStakedSystemToken().address as addressString;

        return this.signCustomTransaction(
            stakedSystemTokenContractAddress,
            stlosAbiDeposit,
            [],
            amount,
        ).catch((error) => {
            throw this.handleCatchError(error);
        });
    }

    /**
     * This method creates a Transaction to unstake system tokens
     * @param amount amount of system tokens to unstake
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async unstakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse> {
        this.trace('unstakeSystemTokens', amount.toString());
        // prepare variables
        const chainSettings = this.getChainSettings();
        const stakedSystemTokenContractAddress = chainSettings.getStakedSystemToken().address as addressString;
        const value = amount.toHexString();
        const from = this.getAccountAddress();

        return this.signCustomTransaction(
            stakedSystemTokenContractAddress,
            stlosAbiWithdraw,
            [value, from, from],
        );
    }

    /**
     * This method creates a Transaction to withdraw all unblocked staked tokens
     */
    async withdrawUnstakedTokens() : Promise<EvmTransactionResponse> {
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
        return useEVMStore().isProviderOnTheCorrectChain(await this.web3Provider(), chainId);
    }

    async externalProvider(): Promise<ethers.providers.ExternalProvider> {
        return this.ensureInitializedProvider();
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        this.trace('web3Provider');
        const web3Provider = new ethers.providers.Web3Provider(await this.externalProvider());
        await web3Provider.ready;
        return web3Provider;
    }

    async ensureCorrectChain(): Promise<ethers.providers.Web3Provider> {
        this.trace('ensureCorrectChain');
        return super.ensureCorrectChain();
    }

}
