/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Mocking Antelope and Config -----------------------------------
import { EVMAuthenticator } from 'src/antelope/wallets/authenticators/EVMAuthenticator';
import { AntelopeError, AntelopeErrorPayload } from 'src/antelope/types';
import { App } from 'vue';
import { Authenticator } from 'universal-authenticator-library';
import { Subject } from 'rxjs';
import { AccountModel } from 'src/antelope/mocks/AccountStore';

export interface ComplexMessage {
    tag: string,
    class: string,
    text: string,
}

export class AntelopeWallets {
    private authenticators: Map<string, EVMAuthenticator> = new Map();
    init() {
        // dummie function
    }
    addEVMAuthenticator(authenticator: EVMAuthenticator) {
        this.authenticators.set(authenticator.getName(), authenticator);
    }
    getAuthenticator(name: string) {
        return this.authenticators.get(name);
    }
}

export class AntelopeConfig {
    transactionError(description: string, error: unknown): AntelopeError {
        if (error instanceof AntelopeError) {
            return error as AntelopeError;
        }
        const str = this.errorToStringHandler(error);
        // if it matches antelope.*.error_*
        if (str.match(/^antelope\.[a-z0-9_]+\.error_/)) {
            return new AntelopeError(str, { error });
        } else {
            return new AntelopeError(description, { error: str });
        }
    }

    // indexer health threshold --
    private __indexer_health_threshold = 10; // 10 seconds

    // indexer health check interval --
    private __indexer_health_check_interval = 1000 * 60 * 5; // 5 minutes expressed in milliseconds

    // notifucation handlers --
    private __notify_error_handler: (message: string) => void = m => alert(`Error: ${m}`);
    private __notify_success_handler: (message: string) => void = alert;
    private __notify_warning_handler: (message: string) => void = alert;

    // notification handlers --
    private __notify_successful_trx_handler: (link: string) => void = alert;
    private __notify_success_message_handler: (message: string, payload?: never) => void = alert;
    private __notify_success_copy_handler: () => void = alert;
    private __notify_failure_message_handler: (message: string, payload?: AntelopeErrorPayload) => void = alert;
    private __notify_failure_action_handler: (message: string, payload?: AntelopeErrorPayload) => void = alert;
    private __notify_disconnected_handler: () => void = alert;
    private __notify_neutral_message_handler: (message: string) => (() => void) = () => (() => void 0);
    private __notify_remember_info_handler: (title: string, message: string | ComplexMessage[],
        payload: string, key: string) => (() => void) = () => (() => void 0);

    // ual authenticators list getter --
    private __authenticators_getter: () => Authenticator[] = () => [];

    // localization handler --
    private __localization_handler: (key: string, payload?: Record<string, unknown>) => string = (key: string) => key;

    // transaction error handler --
    private __transaction_error_handler: (err: AntelopeError, trxFailed: string) => void = () => void 0;

    // error to string handler --
    private __error_to_string_handler: (error: unknown) => string = (error: unknown) => {
        try {

            type EVMError = {code:string};
            const evmErr = error as EVMError;

            switch (evmErr.code) {
            case 'CALL_EXCEPTION':          return 'antelope.evm.error_call_exception';
            case 'INSUFFICIENT_FUNDS':      return 'antelope.evm.error_insufficient_funds';
            case 'MISSING_NEW':             return 'antelope.evm.error_missing_new';
            case 'NONCE_EXPIRED':           return 'antelope.evm.error_nonce_expired';
            case 'NUMERIC_FAULT':           return 'antelope.evm.error_numeric_fault';
            case 'REPLACEMENT_UNDERPRICED': return 'antelope.evm.error_replacement_underpriced';
            case 'TRANSACTION_REPLACED':    return 'antelope.evm.error_transaction_replaced';
            case 'UNPREDICTABLE_GAS_LIMIT': return 'antelope.evm.error_unpredictable_gas_limit';
            case 'USER_REJECTED':           return 'antelope.evm.error_user_rejected';
            case 'ACTION_REJECTED':         return 'antelope.evm.error_transaction_canceled';
            }

            if (typeof error === 'string') {
                return error;
            }
            if (typeof error === 'number') {
                return error.toString();
            }
            if (typeof error === 'boolean') {
                return error.toString();
            }
            if (error instanceof Error) {
                return error.message;
            }
            if (typeof error === 'undefined') {
                return 'undefined';
            }
            if (typeof error === 'object') {
                if (error === null) {
                    return 'null';
                }
                if (Array.isArray(error)) {
                    return error.map(a => this.__error_to_string_handler(a)).join(', ');
                }
                return JSON.stringify(error);
            }
            return 'unknown';
        } catch (er) {
            return 'error';
        }
    };

    // Vue.App holder --
    private __app: App | null = null;

    constructor() {
        //
    }

    init(app: App) {
        this.__app = app;
    }

    get app() {
        return this.__app;
    }

    get indexerHealthThresholdSeconds() {
        return this.__indexer_health_threshold;
    }

    get indexerHealthCheckInterval() {
        return this.__indexer_health_check_interval;
    }

    get notifyErrorHandler() {
        return this.__notify_error_handler;
    }

    get notifySuccessHandler() {
        return this.__notify_success_handler;
    }

    get notifyWarningHandler() {
        return this.__notify_warning_handler;
    }

    get notifySuccessfulTrxHandler() {
        return this.__notify_successful_trx_handler;
    }

    get notifySuccessMessageHandler() {
        return this.__notify_success_message_handler;
    }

    get notifySuccessCopyHandler() {
        return this.__notify_success_copy_handler;
    }

    get notifyFailureMessage() {
        return this.__notify_failure_message_handler;
    }

    get notifyFailureWithAction() {
        return this.__notify_failure_action_handler;
    }

    get notifyDisconnectedHandler() {
        return this.__notify_disconnected_handler;
    }

    get notifyNeutralMessageHandler() {
        return this.__notify_neutral_message_handler;
    }

    get notifyRememberInfoHandler() {
        return this.__notify_remember_info_handler;
    }

    get authenticatorsGetter() {
        return this.__authenticators_getter;
    }

    get localizationHandler() {
        return this.__localization_handler;
    }

    get transactionErrorHandler() {
        return this.__transaction_error_handler;
    }

    get errorToStringHandler() {
        return this.__error_to_string_handler;
    }

    // setting indexer constants --
    public setIndexerHealthThresholdSeconds(threshold: number) {
        this.__indexer_health_threshold = threshold;
    }

    public setIndexerHealthCheckInterval(interval: number) {
        this.__indexer_health_check_interval = interval;
    }

    // setting notification handlers --
    public setNotifyErrorHandler(handler: (message: string) => void) {
        this.__notify_error_handler = handler;
    }

    public setNotifySuccessHandler(handler: (message: string) => void) {
        this.__notify_success_handler = handler;
    }

    public setNotifyWarningHandler(handler: (message: string) => void) {
        this.__notify_warning_handler = handler;
    }

    public setNotifySuccessfulTrxHandler(handler: (link: string) => void) {
        this.__notify_successful_trx_handler = handler;
    }

    public setNotifySuccessMessageHandler(handler: (message: string, payload?: never) => void) {
        this.__notify_success_message_handler = handler;
    }

    public setNotifySuccessCopyHandler(handler: () => void) {
        this.__notify_success_copy_handler = handler;
    }

    public setNotifyFailureMessage(handler: (message: string, payload?: AntelopeErrorPayload) => void) {
        this.__notify_failure_message_handler = handler;
    }

    public setNotifyFailureWithAction(handler: (message: string, payload?: AntelopeErrorPayload) => void) {
        this.__notify_failure_action_handler = handler;
    }

    public setNotifyDisconnectedHandler(handler: () => void) {
        this.__notify_disconnected_handler = handler;
    }

    public setNotifyNeutralMessageHandler(handler: (message: string) => (() => void)) {
        this.__notify_neutral_message_handler = handler;
    }

    public setNotifyRememberInfoHandler(handler: (
        title: string,
        message: string | ComplexMessage[],
        payload: string,
        key: string,
    ) => (() => void)) {
        this.__notify_remember_info_handler = handler;
    }

    // setting authenticators getter --
    public setAuthenticatorsGetter(getter: () => Authenticator[]) {
        this.__authenticators_getter = getter;
    }

    // setting translation handler --
    public setLocalizationHandler(handler: (key: string, payload?: Record<string, unknown>) => string) {
        this.__localization_handler = handler;
    }

    // setting transaction error handler --
    public setTransactionErrorHandler(handler: (err: AntelopeError, trxFailed: string) => void) {
        this.__transaction_error_handler = handler;
    }

    // setting error to string handler --
    public setErrorToStringHandler(handler: (catched: unknown) => string) {
        this.__error_to_string_handler = handler;
    }

}

const config = new AntelopeConfig();
const wallets = new AntelopeWallets();
const events = {
    onLoggedIn: new Subject<AccountModel>(),
    onLoggedOut: new Subject<void>(),
};
const Antelope = {
    config,
    wallets,
    events,
};

export const getAntelope = () => Antelope;
// ----------------------------------------------------------------

