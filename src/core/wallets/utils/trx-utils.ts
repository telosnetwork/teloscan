import { usePlatformStore } from 'src/core';
import { ethers } from 'ethers';
import { AccountModel } from 'src/core/mocks';
import { CoreError, TransactionResponse } from 'src/core/types';
import { EVMAuthenticator } from 'src/core/wallets';


export async function subscribeForTransactionReceipt(account: AccountModel, response: TransactionResponse): Promise<{
    newResponse: TransactionResponse;
    receipt: ethers.providers.TransactionReceipt;
}> {
    if (account.isNative) {
        throw new CoreError('Not implemented yet for native');
    } else {
        const authenticator = account.authenticator as EVMAuthenticator;
        const provider = await authenticator.web3Provider();
        const result = {
            newResponse: { ...response } as TransactionResponse,
            receipt: {} as ethers.providers.TransactionReceipt,
        };
        if (provider) {
            const whenConfirmed = provider.waitForTransaction(response.hash);
            // we add the wait method to the response,
            // so that the caller can subscribe to the confirmation event
            result.newResponse.wait = async () => whenConfirmed;
            return result;
        } else {
            if (usePlatformStore().isMobile) {
                response.wait = async () => Promise.resolve({} as ethers.providers.TransactionReceipt);
                return result;
            } else {
                throw new CoreError('core.evm.error_no_provider');
            }
        }
    }
}
