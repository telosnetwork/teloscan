import { EthereumProvider } from 'src/antelope/types';
import { EVMAuthenticator, InjectedProviderAuth } from 'src/antelope/wallets';

const name = 'SafePal';
export const SafePalAuthName = name;
export class SafePalAuth extends InjectedProviderAuth {

    // this is just a dummy label to identify the authenticator base class
    constructor(label = name) {
        super(label);
    }

    // InjectedProviderAuth API ------------------------------------------------------

    getProvider(): EthereumProvider | null {
        return (window as unknown as {safepalProvider:unknown}).safepalProvider as EthereumProvider ?? null;
    }

    // EVMAuthenticator API ----------------------------------------------------------

    getName(): string {
        return name;
    }

    // this is the important instance creation where we define a label to assign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        return new SafePalAuth(label);
    }
}
