/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Mocking Antelope and Config -----------------------------------
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

const config = {
    notifyNeutralMessageHandler: (message: string) => void 0,
    localizationHandler: (message: string, params?: Record<string, string>) => message,
    notifyFailureWithActionHandler: (message: string, action: () => void) => void 0,
    notifyFailureWithAction: (message: string, params?: { label: string; handler: () => void; }) => void 0,
};

const wallets = new AntelopeWallets();
const Antelope = {
    config,
    wallets,
};

export const getAntelope = () => Antelope;
// ----------------------------------------------------------------

