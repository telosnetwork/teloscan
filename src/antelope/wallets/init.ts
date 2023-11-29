// register wallets ----------------------------------------------------------------

import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3ModalConfig } from '@web3modal/html';
import { OreIdOptions } from 'oreid-js';
import { MetamaskAuth, OreIdAuth, SafePalAuth, WalletConnectAuth, BraveAuth } from 'src/antelope/wallets';
import { configureChains, createConfig } from '@wagmi/core';
import { telos, telosTestnet } from '@wagmi/core/chains';
import { getAntelope } from 'src/antelope/mocks/AntelopeConfig';
import { App } from 'vue';
import { AntelopeError } from 'src/antelope/types';

/**
 * This function is used to register the EVMAuthenticators that will be used by the app.
 */
export function initAntelope(app: App) {
    const oreIdOptions: OreIdOptions = {
        appName: process.env.APP_NAME,
        appId: process.env.OREID_APP_ID as string,
    };

    const projectId = process.env.PROJECT_ID || '14ec76c44bae7d461fa0f5fd5f8a9da1';
    console.log('process.env', process.env);
    const chains = [telos, telosTestnet];

    const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

    // Wagmi Client --
    const wagmiConfig = createConfig({
        autoConnect: true,
        connectors: w3mConnectors({ projectId, chains }),
        publicClient,
    });

    const wagmiClient = new EthereumClient(wagmiConfig, chains);

    // Wagmi Options --
    const explorerRecommendedWalletIds = [
        // MetaMask
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        // SafePal
        // '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150',
    ];
    const explorerExcludedWalletIds = 'ALL' as const; // Web3Modal option excludes all but recomended
    const wagmiOptions: Web3ModalConfig = { projectId, explorerRecommendedWalletIds, explorerExcludedWalletIds };

    const ant = getAntelope();
    ant.config.init(app);

    // settting notification handlers --
    ant.config.setNotifySuccessfulTrxHandler(app.config.globalProperties.$notifySuccessTransaction);
    ant.config.setNotifySuccessMessageHandler(app.config.globalProperties.$notifySuccessMessage);
    ant.config.setNotifySuccessCopyHandler(app.config.globalProperties.$notifySuccessCopy);
    ant.config.setNotifyFailureMessage(app.config.globalProperties.$notifyFailure);
    ant.config.setNotifyFailureWithAction(app.config.globalProperties.$notifyFailureWithAction);
    ant.config.setNotifyDisconnectedHandler(app.config.globalProperties.$notifyDisconnected);
    ant.config.setNotifyNeutralMessageHandler(app.config.globalProperties.$notifyNeutralMessage);
    ant.config.setNotifyRememberInfoHandler(app.config.globalProperties.$notifyRememberInfo);


    // setting authenticators getter --
    ant.config.setAuthenticatorsGetter(
        () => app.config.globalProperties.$ual.getAuthenticators().availableAuthenticators);

    // setting translation handler --
    ant.config.setLocalizationHandler(
        (key:string, payload?: Record<string, unknown>) => app.config.globalProperties.$t(key, payload ? payload : {}));

    // setting transaction error handler --
    ant.config.setTransactionErrorHandler((err: object) => {
        if (err instanceof AntelopeError) {
            const evmErr = err as AntelopeError;
            if (evmErr.message === 'antelope.evm.error_transaction_canceled') {
                ant.config.notifyNeutralMessageHandler(ant.config.localizationHandler(evmErr.message));
            } else {
                ant.config.notifyFailureMessage(ant.config.localizationHandler(evmErr.message), evmErr.payload);
            }
        } else {
            ant.config.notifyFailureMessage(ant.config.localizationHandler('evm_wallet.general_error'));
        }
    });

    // set evm authenticators --
    ant.wallets.addEVMAuthenticator(new WalletConnectAuth(wagmiOptions, wagmiClient));
    ant.wallets.addEVMAuthenticator(new OreIdAuth(oreIdOptions));
    ant.wallets.addEVMAuthenticator(new MetamaskAuth());
    ant.wallets.addEVMAuthenticator(new SafePalAuth());
    ant.wallets.addEVMAuthenticator(new BraveAuth());

}

