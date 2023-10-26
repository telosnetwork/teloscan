/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
export interface EthereumProvider {
    // ethereum provider standard API -----
    isMetaMask?: boolean;
    isStatus?: boolean;
    host?: string;
    path?: string;
    sendAsync?: (request: { method: string, params?: Array<unknown> }, callback: (error: unknown, response: unknown) => void) => void;
    send?: (request: { method: string, params?: Array<unknown> }, callback: (error: unknown, response: unknown) => void) => void;
    request: (request: { method: string, params?: Array<unknown> }) => Promise<unknown>;

    // event and listeners -----
    once?(eventName: string | symbol, listener: (...args: unknown[]) => void): this;
    on(eventName: string | symbol, listener: (...args: unknown[]) => void): this;
    off?(eventName: string | symbol, listener: (...args: unknown[]) => void): this;
    addListener?(eventName: string | symbol, listener: (...args: unknown[]) => void): this;
    removeListener?(eventName: string | symbol, listener: (...args: unknown[]) => void): this;
    removeAllListeners?(event?: string | symbol): this;

    // internal injected API -----
    __initialized: boolean;
}

