import { EVMAuthenticator } from 'src/antelope/wallets/authenticators/EVMAuthenticator';

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

export * from 'src/antelope/wallets/authenticators/EVMAuthenticator';
export * from 'src/antelope/wallets/authenticators/OreIdAuth';
export * from 'src/antelope/mocks/index';