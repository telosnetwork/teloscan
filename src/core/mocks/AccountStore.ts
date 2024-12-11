/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
// Mocking AccountStore -----------------------------------
// useAccountStore().getAccount(this.label).account as addressString;
import { EVMAuthenticator } from 'src/core/wallets';
import { CoreError, addressString } from 'src/core/types';
import { CURRENT_CONTEXT, TeloscanEVMChainSettings, createTraceFunction, useChainStore } from 'src/core/mocks';
import { BigNumber } from 'ethers'; 'src/core/mocks/FeedbackStore';
import { getCore } from 'src/core/mocks/CoreConfig';
import { useFeedbackStore } from 'src/core/mocks';
import { EvmABI, EvmFunctionParam, Label, TransactionResponse } from 'src/core/types';
import { subscribeForTransactionReceipt } from 'src/core/wallets/utils/trx-utils';

export interface AccountModel {
    label: typeof CURRENT_CONTEXT;
    isNative: boolean;
    authenticator: EVMAuthenticator;
    account: addressString;
}

export interface EvmAccountModel extends AccountModel {
    address: addressString;
    displayAddress: string;
    isNative: false;
    associatedNative: string;
    authenticator: EVMAuthenticator;
}

let currentAuthenticator = {} as EVMAuthenticator;
let currentAccount = null as addressString | null;

interface LoginEVMActionData {
    authenticator: EVMAuthenticator
    network: string,
    autoLogAccount?: string,
}

class AccountStore {

    trace: (action: string, ...args: unknown[]) => void;

    constructor() {
        this.trace = createTraceFunction('EVMStore');
    }

    getAccount(label: string) {
        return {
            label,
            isNative: false,
            authenticator: currentAuthenticator,
            account: currentAccount,
        } as AccountModel;
    }

    async loginEVM({ authenticator, network, autoLogAccount }: LoginEVMActionData, trackAnalyticsEvents: boolean): Promise<boolean> {
        currentAuthenticator = authenticator;
        currentAccount = autoLogAccount
            ? await authenticator.autoLogin(network, autoLogAccount, trackAnalyticsEvents)
            : await authenticator.login(network, trackAnalyticsEvents);

        if (currentAccount) {
            const account = useAccountStore().getAccount(authenticator.label);
            getCore().events.onLoggedIn.next(account);
        }
        return !!currentAccount;
    }

    logout() {
        currentAuthenticator.logout();
        currentAuthenticator = {} as EVMAuthenticator;
        currentAccount = null;
        getCore().events.onLoggedOut.next();
    }

    get loggedAccount() {
        return this.getAccount(CURRENT_CONTEXT);
    }

    get currentAccount() {
        return this.getAccount(CURRENT_CONTEXT);
    }

    async subscribeForTransactionReceipt(account: EvmAccountModel, response: TransactionResponse): Promise<TransactionResponse> {
        this.trace('subscribeForTransactionReceipt', account.account, response.hash);
        return subscribeForTransactionReceipt(account, response).then(({ newResponse, receipt }) => {
            newResponse.wait().then(() => {
                this.trace('subscribeForTransactionReceipt', newResponse.hash, 'receipt:', receipt.status, receipt);
            });
            return newResponse;
        });
    }

    async signCustomTransaction(
        label: Label,
        actionMessage: string,
        actionError: string,
        contract: string,
        abi: EvmABI,
        parameters: EvmFunctionParam[],
        value?: BigNumber,
    ): Promise<TransactionResponse>{
        const ant = getCore();
        const funcname = 'signCustomTransaction';
        this.trace(funcname, label, contract, abi, parameters, value?.toString());

        if (! await this.assertNetworkConnection(label)) {
            throw new CoreError('core.evm.error_switch_chain_rejected');
        }

        try {
            useFeedbackStore().setLoading(funcname);
            const account = this.loggedAccount as EvmAccountModel;
            const authenticator = this.loggedAccount.authenticator as EVMAuthenticator;
            const chainSettings = useChainStore().loggedChain.settings as unknown as TeloscanEVMChainSettings;

            const tx = await authenticator.signCustomTransaction(contract, abi, parameters, value)
                .then(r => this.subscribeForTransactionReceipt(account, r as TransactionResponse));

            // we create tne neutral notification
            const dismiss = ant.config.notifyNeutralMessageHandler(actionMessage);

            tx.wait().then(() => {
                ant.config.notifySuccessfulTrxHandler(
                    `${chainSettings.getExplorerUrl()}/tx/${tx.hash}`,
                );
            }).catch((err) => {
                console.error(err);
            }).finally(() => {
                dismiss();
            });

            return tx;
        } catch (error) {
            const trxError = ant.config.transactionError(actionError, error);
            ant.config.transactionErrorHandler(trxError, funcname);
            throw trxError;
        } finally {
            useFeedbackStore().unsetLoading(funcname);
        }
    }

    async isConnectedToCorrectNetwork(label: string): Promise<boolean> {
        this.trace('isConnectedToCorrectNetwork', label);
        try {
            useFeedbackStore().setLoading('account.isConnectedToCorrectNetwork');
            const authenticator = useAccountStore().getAccount(label)?.authenticator as EVMAuthenticator;
            return authenticator.isConnectedToCorrectChain();
        } catch (error) {
            console.error('Error: ', error);
            return Promise.resolve(false);
        } finally {
            useFeedbackStore().unsetLoading('account.isConnectedToCorrectNetwork');
        }
    }

    async assertNetworkConnection(label: string): Promise<boolean> {
        if (!await useAccountStore().isConnectedToCorrectNetwork(label)) {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise<boolean>(async (resolve) => {
                const ant = getCore();
                const authenticator = useAccountStore().loggedAccount.authenticator as EVMAuthenticator;
                try {
                    await authenticator.ensureCorrectChain();
                    if (!await useAccountStore().isConnectedToCorrectNetwork(label)) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                } catch (error) {
                    const message = (error as Error).message;
                    if (message === 'core.evm.error_switch_chain_rejected') {
                        ant.config.notifyNeutralMessageHandler(message);
                    }
                    resolve(false);
                }
            });
        } else {
            return true;
        }
    }

}

const accountStore = new AccountStore();

export const useAccountStore = () => accountStore;
