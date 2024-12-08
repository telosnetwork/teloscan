/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
        const msgOrObject = this.errorMessageExtractor(error);
        // if it matches antelope.*.error_*
        if (typeof msgOrObject === 'string') {
            return new AntelopeError(msgOrObject, { error });
        } else {
            return new AntelopeError(description, { error: msgOrObject });
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
    private __error_message_extractor: (error: unknown) => object | string | null = (error: unknown) => {
        try {
            type EVMError = {code:string};
            const evmErr = error as EVMError;

            // high priority generic errors
            switch (evmErr.code) {
            case 'CALL_EXCEPTION':          return 'antelope.evm.error_call_exception';
            case 'INSUFFICIENT_FUNDS':      return 'antelope.evm.error_insufficient_funds';
            case 'MISSING_NEW':             return 'antelope.evm.error_missing_new';
            case 'NONCE_EXPIRED':           return 'antelope.evm.error_nonce_expired';
            case 'NUMERIC_FAULT':           return 'antelope.evm.error_numeric_fault';
            case 'REPLACEMENT_UNDERPRICED': return 'antelope.evm.error_replacement_underpriced';
            case 'TRANSACTION_REPLACED':    return 'antelope.evm.error_transaction_replaced';
            case 'USER_REJECTED':           return 'antelope.evm.error_user_rejected';
            case 'ACTION_REJECTED':         return 'antelope.evm.error_transaction_canceled';
            }

            if (typeof error === 'object') {
                const candidates = ['message', 'reason'];

                const extractDeepestErrorMessage = (error: unknown): string => {
                    if (typeof error !== 'object' || error === null) {
                        return 'unknown';  // We return 'unknown' if it is not an object or is null
                    }
                    const queue: {node: unknown, depth: number}[] = [{ node: error, depth: 0 }];
                    let deepestMessage = 'unknown';
                    let maxDepth = -1;

                    while (queue.length > 0) {
                        const { node, depth } = queue.shift()!;  // Sacamos el primer elemento de la cola

                        const nodeKeys = Object.keys(node as Record<string, unknown>);
                        for (const key of nodeKeys) {
                            const value = (node as Record<string, unknown>)[key];
                            if (candidates.includes(key) && typeof value === 'string') {
                                // If we find a message in a deeper level, we update it
                                if (depth > maxDepth) {
                                    deepestMessage = value;
                                    maxDepth = depth;
                                }
                            } else if (typeof value === 'object' && value !== null) {
                                // If the value is an object, we add it to the queue to explore its children
                                queue.push({ node: value, depth: depth + 1 });
                            }
                        }
                    }

                    return deepestMessage;
                };
                const messageFound = extractDeepestErrorMessage(error as Record<string, unknown>);
                if (messageFound !== 'unknown') {
                    return messageFound;
                }
            }

            // low priority generic errors
            switch (evmErr.code) {
            case 'UNPREDICTABLE_GAS_LIMIT': return 'antelope.evm.error_unpredictable_gas_limit';
            }

            if (typeof error === 'string') {
                return { text: error };
            }
            if (typeof error === 'number') {
                return { number: error.toString() };
            }
            if (typeof error === 'boolean') {
                return { boolean: error.toString() };
            }
            if (typeof error === 'undefined') {
                return { value: 'undefined' };
            }
            if (typeof error === 'object') {
                return error;
            }
            return { };
        } catch (er) {
            return { };
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

    get errorMessageExtractor() {
        return this.__error_message_extractor;
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
    public setErrorMessageExtractor(handler: (catched: unknown) => object | string | null) {
        this.__error_message_extractor = handler;
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

