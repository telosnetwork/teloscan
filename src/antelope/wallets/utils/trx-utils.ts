import { usePlatformStore } from 'src/antelope';
import { ethers } from 'ethers';
import { AccountModel } from 'src/antelope/mocks';
import { AntelopeError, TransactionResponse } from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';


export async function subscribeForTransactionReceipt(account: AccountModel, response: TransactionResponse): Promise<{
    newResponse: TransactionResponse;
    receipt: ethers.providers.TransactionReceipt;
}> {
    if (account.isNative) {
        throw new AntelopeError('Not implemented yet for native');
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
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
        }
    }
}
