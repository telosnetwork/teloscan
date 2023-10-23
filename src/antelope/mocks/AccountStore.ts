// Mocking AccountStore -----------------------------------
// useAccountStore().getAccount(this.label).account as addressString;
import { EVMAuthenticator } from 'src/antelope/wallets';
import { addressString } from 'src/antelope/types';
import { CURRENT_CONTEXT } from 'src/antelope/mocks';

export interface AccountModel {
    label: typeof CURRENT_CONTEXT;
    isNative: boolean;
    authenticator: EVMAuthenticator;
    account: addressString;
}

let currentAuthenticator = {} as EVMAuthenticator;
let currentAccount = null as addressString | null;

interface LoginEVMActionData {
    authenticator: EVMAuthenticator
    network: string,
}

const AccountStore = {
    getAccount: (label: string) => ({
        label,
        isNative: false,
        authenticator: currentAuthenticator,
        account: currentAccount,
    } as AccountModel),

    async loginEVM({ authenticator, network }: LoginEVMActionData): Promise<boolean> {
        currentAuthenticator = authenticator;
        currentAccount = await authenticator.login(network);
        return true;
    },

    logout() {
        console.log('AccountStore.logout()');
        currentAuthenticator.logout();
        currentAuthenticator = {} as EVMAuthenticator;
        currentAccount = null;
    },

    get loggedAccount() {
        return this.getAccount(CURRENT_CONTEXT);
    },

    get currentAccount() {
        return this.getAccount(CURRENT_CONTEXT);
    },
};

export const useAccountStore = () => AccountStore;
