import { boot } from 'quasar/wrappers';
import { ethers } from 'ethers';
import { useChainStore } from 'src/core';

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
            providerContainer.provider, parseInt(useChainStore().currentChain.settings.getChainId(), 10),
        );
    }

    getProvider() {
        return providerContainer.provider;
    }
}

const providerManager = new ProviderManager();

export default boot(({ app, store }) => {
    store.$providerManager = app.config.globalProperties.$providerManager = providerManager;
});

export { providerManager };
