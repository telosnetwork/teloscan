import { evmSettings, TeloscanEVMChainSettings, useChainStore } from 'src/core';
import { CURRENT_CONTEXT } from 'src/core/mocks';
import { ref, watch } from 'vue';
import { RouteLocationNormalizedLoaded, Router } from 'vue-router';

export interface ChainOption {
    network: string;
    settings: TeloscanEVMChainSettings;
    extern: boolean;
}

export const chains = [
    {
        network: 'telos-evm',
        settings: evmSettings['telos-evm'],
        extern: true,
    },
    {
        network: 'telos-evm-testnet',
        settings: evmSettings['telos-evm-testnet'],
        extern: true,
    },
] as ChainOption[];

export const multichainSelectedNetwork = ref<ChainOption | undefined>(undefined);

export const switchChain = (chain: ChainOption) => {
    if (chain.extern) {
        window.open(chain.settings.getExplorerUrl(), '_blank');
        return;
    } else {
        multichainSelectedNetwork.value = chain;
        updateSelectedNetworkFromUserChoise();
    }
};

const quasar = {
    $router: null as never as Router,
    $route: null as never as RouteLocationNormalizedLoaded,
};

export function initMultichain($router: Router, $route: RouteLocationNormalizedLoaded) {
    quasar.$router = $router;
    quasar.$route = $route;
    const defaultNetwork = Object.keys(evmSettings)[0];
    let network = new URLSearchParams(window.location.search).get('network') ?? process.env.NETWORK_EVM_NAME;
    if (network) {
        const exists = Object.keys(evmSettings).some(key => evmSettings[key].getNetwork() === network);
        if (!exists) {
            network = defaultNetwork;
        }
    } else {
        network = defaultNetwork;
    }
    if (process.env.NETWORK_EVM_NAME !== network) {
        // only if different from default
        quasar.$router.replace({ query: { ...quasar.$route.query, network } });
    }
    multichainSelectedNetwork.value = chains.find(chain => chain.network === network);
}

const chainStore = useChainStore();

async function updateSelectedNetworkFromUrl() {

    const network = new URLSearchParams(window.location.search).get('network') ?? process.env.NETWORK_EVM_NAME;
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
    const network = multichainSelectedNetwork?.value?.network ?? process.env.NETWORK_EVM_NAME;
    if (typeof network === 'string') {
        chainStore.setChain(CURRENT_CONTEXT, network);
        quasar.$router.replace({ query: { ...quasar.$route.query, network } });
        return;
    }
    console.error('Multichain updateSelectedNetworkFromChainStore() invalid network', { network });
}

watch(() => window.location.search, () => updateSelectedNetworkFromUrl());
