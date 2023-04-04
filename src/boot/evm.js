import { boot } from 'quasar/wrappers';
import { TelosEvmApi } from '@telosnetwork/telosevm-js';
import ContractManager from 'src/lib/ContractManager';
import fetch from 'node-fetch';
import axios from 'axios';
import { ethers } from 'ethers';
import { markRaw } from 'vue';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { configureChains, createClient } from '@wagmi/core';
import { telos, telosTestnet } from '@wagmi/core/chains';


const evm = new TelosEvmApi({
    endpoint: process.env.NETWORK_EVM_ENDPOINT,
    chainId: parseInt(process.env.NETWORK_EVM_CHAIN_ID),
    ethPrivateKeys: [],
    telosContract: process.env.NETWORK_EVM_CONTRACT,
    telosPrivateKeys: [],
    fetch,
});

// This is kinda bad, but if you try to store a web3 provider in the store, it has a call stack size exception,
//    and if you freeze the provider before putting in the store so the call stack error goes away, you break
//    the provider. so, this is a workaround until some better solution is needed and/or available
const providerContainer = {
    provider: null,
};

class ProviderManager {
    setProvider(provider) {
        providerContainer.provider = provider;
    }

    getEthersProvider() {
        return new ethers.providers.Web3Provider(
            providerContainer.provider, parseInt(process.env.NETWORK_EVM_CHAIN_ID, 10),
        );
    }

    getProvider() {
        return providerContainer.provider;
    }
}

const hyperion = axios.create({
    baseURL: process.env.NETWORK_EVM_ENDPOINT,
});

const contractManager = new ContractManager(hyperion);
contractManager.init();

/** Wagmi Client for WalletConnect */
const PROJECT_ID = '14ec76c44bae7d461fa0f5fd5f8a9da1';

const chains = [telos, telosTestnet];
const { provider } = configureChains(chains, [w3mProvider({ projectId: PROJECT_ID })]);

const wagmi = createClient({
    autoConnect: false,
    connectors: w3mConnectors({ projectId: PROJECT_ID, version: 1, chains }),
    provider,
});

const wagmiClient = new EthereumClient(wagmi, chains);


export default boot(({ app, store }) => {
    store.$providerManager = app.config.globalProperties.$providerManager = new ProviderManager();
    store.$evm = app.config.globalProperties.$evm = evm;
    store.$evmEndpoint = app.config.globalProperties.$evmEndpoint = hyperion;
    store.$contractManager = app.config.globalProperties.$contractManager = markRaw(contractManager);
    store.$wagmiClient = app.config.globalProperties.$wagmiClient = wagmiClient;
});

export { evm };
