// Mocking AccountStore -----------------------------------
// useAccountStore().getAccount(this.label).account as addressString;
import { EVMAuthenticator } from 'src/antelope/wallets';
import { addressString } from 'src/antelope/wallets/types';
import { CURRENT_CONTEXT } from 'src/antelope/mocks';
import loginStore from 'src/store/login';

export interface AccountModel {
    label: typeof CURRENT_CONTEXT;
    isNative: boolean;
    authenticator: EVMAuthenticator;
    account: addressString;
}

let currentAuthenticator = {} as EVMAuthenticator;

interface LoginEVMActionData {
    authenticator: EVMAuthenticator
    network: string,
}

const AccountStore = {
    getAccount: (label: string) => ({
        label,
        isNative: false,
        authenticator: currentAuthenticator,
        account: loginStore.getters.address(),
    } as AccountModel),
    async loginEVM({ authenticator, network }: LoginEVMActionData): Promise<boolean> {
        // FIXME: remove the console.log
        console.log('AccountStore.loginEVM', authenticator, network);
        currentAuthenticator = authenticator;
        authenticator.login(network);
        return true;
    },
};
export const useAccountStore = () => AccountStore;
