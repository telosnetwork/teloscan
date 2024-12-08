import { boot } from 'quasar/wrappers';
import { TelosEvmApi } from '@telosnetwork/telosevm-js';
import fetch from 'node-fetch';
import axios from 'axios';
import { ethers } from 'ethers';

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
// providerContainer.provider type is: ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc | null
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

const providerManager = new ProviderManager();

export default boot(({ app, store }) => {
    store.$providerManager = app.config.globalProperties.$providerManager = providerManager;
    store.$evm = app.config.globalProperties.$evm = evm;
    store.$evmEndpoint = app.config.globalProperties.$evmEndpoint = hyperion;
});

export { evm, providerManager };
