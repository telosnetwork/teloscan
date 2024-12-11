import { evmSettings, TeloscanEVMChainSettings, useChainStore } from 'src/core';
import { CURRENT_CONTEXT } from 'src/core/mocks';
import { ref, watch } from 'vue';
import { RouteLocationNormalizedLoaded, Router } from 'vue-router';

export interface ChainOption {
    network: string;
    settings: TeloscanEVMChainSettings;
}

export const chains = [
    {
        network: 'telos-evm',
        settings: evmSettings['telos-evm'],
    },
    {
        network: 'telos-evm-testnet',
        settings: evmSettings['telos-evm-testnet'],
    },
] as ChainOption[];

console.log('process.env.NETWORK_EVM_NAME:', process.env.NETWORK_EVM_NAME); // FIXME: remove

export const multichainSelectedNetwork = ref<ChainOption | undefined>(chains.find(chain => chain.network === process.env.NETWORK_EVM_NAME));

export const switchChain = (chain: ChainOption) => {
    console.log('Multichain switchChain()', { chain });
    multichainSelectedNetwork.value = chain;
    updateSelectedNetworkFromUserChoise();
};

const quasar = {
    $router: null as never as Router,
    $route: null as never as RouteLocationNormalizedLoaded,
};

export function initMultichain($router: Router, $route: RouteLocationNormalizedLoaded) {
    quasar.$router = $router;
    quasar.$route = $route;
    console.log('Multichain initMultichain()');
    const defaultNetwork = Object.keys(evmSettings)[0];
    let network = new URLSearchParams(window.location.search).get('network');
    if (network) {
        const exists = Object.keys(evmSettings).some(key => evmSettings[key].getNetwork() === network);
        if (!exists) {
            network = defaultNetwork;
        }
    } else {
        network = defaultNetwork;
    }
    quasar.$router.replace({ query: { ...quasar.$route.query, network } });
    multichainSelectedNetwork.value = chains.find(chain => chain.network === network);
}

const chainStore = useChainStore();

async function updateSelectedNetworkFromUrl() {
    console.log('Multichain updateSelectedNetworkFromUrl()');

    const network = new URLSearchParams(window.location.search).get('network');
    if (network) {
        const exists = Object.keys(evmSettings).some(key => evmSettings[key].getNetwork() === network);
        if (exists) {
            multichainSelectedNetwork.value = chains.find(chain => chain.network === network);
        } else {
            console.error('Multichain updateSelectedNetworkFromUrl() invalid network', { network });
        }
    }
}

async function updateSelectedNetworkFromUserChoise() {
    console.log('Multichain updateSelectedNetworkFromChainStore()');
    const network = multichainSelectedNetwork?.value?.network;
    if (typeof network === 'string') {
        chainStore.setChain(CURRENT_CONTEXT, network);
        quasar.$router.replace({ query: { ...quasar.$route.query, network } });
        return;
    }
    console.error('Multichain updateSelectedNetworkFromChainStore() invalid network', { network });
}


// watch(multichainSelectedNetwork, () => {
//     console.log('Multichain watch multichainSelectedNetwork', { value: multichainSelectedNetwork.value, useRouter: useRouter() });
//     if (multichainSelectedNetwork.value) {
//         chainStore.setChain(CURRENT_CONTEXT, multichainSelectedNetwork.value.network);
//         // replace the url to reflect the network
//         const $route = useRoute();
//         useRouter().replace({ query: { ...$route.query, network: multichainSelectedNetwork.value.network } });
//     }
// });
//
// watch(() => chainStore.currentChain, (currentChain) => {
//     console.log('Multichain watch chainStore.currentChain', { network: currentChain.settings.getNetwork(), currentChain });
//     multichainSelectedNetwork.value = chains.find(chain => chain.network === currentChain.settings.getNetwork());
// });

// watch(() => multichainSelectedNetwork, () => updateSelectedNetworkFromUserChoise());
watch(() => window.location.search, () => updateSelectedNetworkFromUrl());
