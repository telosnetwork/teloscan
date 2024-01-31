/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
// Mocking AccountStore -----------------------------------
// useAccountStore().getAccount(this.label).account as addressString;
import { EVMAuthenticator } from 'src/antelope/wallets';
import {
    addressString, EvmABI, EvmFunctionParam, Label, TransactionResponse,
} from 'src/antelope/types';
import {
    CURRENT_CONTEXT, EVMChainSettings, createTraceFunction, useChainStore,
    useFeedbackStore,
} from 'src/antelope/mocks';
import { BigNumber } from 'ethers';

import { getAntelope } from 'src/antelope/mocks/AntelopeConfig';
import { subscribeForTransactionReceipt } from 'src/antelope/wallets/utils/trx-utils';

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

    async loginEVM({ authenticator, network }: LoginEVMActionData, trackAnalyticsEvents: boolean): Promise<boolean> {
        currentAuthenticator = authenticator;
        currentAccount = await authenticator.login(network, trackAnalyticsEvents);
        const account = useAccountStore().getAccount(authenticator.label);
        getAntelope().events.onLoggedIn.next(account);
        return true;
    }

    logout() {
        currentAuthenticator.logout();
        currentAuthenticator = {} as EVMAuthenticator;
        currentAccount = null;
        getAntelope().events.onLoggedOut.next();
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
    ): Promise<TransactionResponse> {
        const ant = getAntelope();
        const funcname = 'signCustomTransaction';
        this.trace(funcname, label, contract, abi, parameters, value?.toString());

        try {
            useFeedbackStore().setLoading(funcname);
            const account = this.loggedAccount as EvmAccountModel;
            const authenticator = this.loggedAccount.authenticator as EVMAuthenticator;
            const chainSettings = useChainStore().loggedChain.settings as unknown as EVMChainSettings;

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
}

const accountStore = new AccountStore();

export const useAccountStore = () => accountStore;
