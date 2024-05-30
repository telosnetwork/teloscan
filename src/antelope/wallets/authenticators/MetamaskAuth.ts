
import { EthereumProvider } from 'src/antelope/types';
import { EVMAuthenticator, InjectedProviderAuth } from 'src/antelope/wallets';

const name = 'Metamask';
export const MetamaskAuthName = name;
export class MetamaskAuth extends InjectedProviderAuth {

    // this is just a dummy label to identify the authenticator base class
    constructor(label = name) {
        super(label);
    }

    // InjectedProviderAuth API ------------------------------------------------------

    getProvider(): EthereumProvider | null {
        return window.ethereum as unknown as EthereumProvider ?? null;
    }

    // EVMAuthenticator API ----------------------------------------------------------

    getName(): string {
        return name;
    }

    // this is the important instance creation where we define a label to assign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        return new MetamaskAuth(label);
    }

}
