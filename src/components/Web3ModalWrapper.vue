<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import {
    ClientCtrl,
    ConfigCtrl,
    ModalCtrl,
    OptionsCtrl,
    ThemeCtrl,
} from '@web3modal/core';
import { configureChains, createClient } from '@wagmi/core';
import { telos } from '@wagmi/core/chains';
import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
} from '@web3modal/ethereum';
// Define constants for configuration
const projectId = '14ec76c44bae7d461fa0f5fd5f8a9da1';
const chains = [telos];
// Configure wagmi client
const { provider } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiClient = createClient({
    autoConnect: true,
    connectors: w3mConnectors({ chains, version: 1, projectId }),
    provider,
});
// Create ethereum and modal clients
const ethereumClient = new EthereumClient(wagmiClient, chains);

import { Web3ModalConfig } from 'src/types';

export class Web3Modal {
    constructor(config: Web3ModalConfig, client: EthereumClient) {
        ThemeCtrl.setThemeConfig(config);
        ClientCtrl.setEthereumClient(client);
        ConfigCtrl.setConfig({ ...config, walletConnectVersion: client.walletConnectVersion });
        this.initUi();
    }
    async initUi() {
        if (typeof window !== 'undefined') {
            await import('@web3modal/ui');
            const modal = document.createElement('w3m-modal');
            document.body.insertAdjacentElement('beforeend', modal);
            OptionsCtrl.setIsUiLoaded(true);
        }
    }
    openModal = ModalCtrl.open;
    closeModal = ModalCtrl.close;
    subscribeModal = ModalCtrl.subscribe;
    setTheme = ThemeCtrl.setThemeConfig;
    setDefaultChain = OptionsCtrl.setSelectedChain;
}

export default defineComponent({
    name: 'Web3ModalWrapper',
    setup(_, { emit }) {
        const web3Modal = ref<Web3Modal | null>(null);
        onMounted(() => {
            // Configure Web3Modal instance
            const config: Web3ModalConfig = {
                projectId: projectId,
                defaultChain: chains[0],
                themeMode: 'dark',
                themeVariables: {
                    '--w3m-z-index': '1000',
                    '--w3m-accent-color': '#0070f3',
                    '--w3m-accent-fill-color': '#0070f3',
                    '--w3m-background-color': '#121212',
                    '--w3m-background-image-url': 'https://your-website.com/background-image.png',
                    '--w3m-logo-image-url': 'https://your-website.com/logo-image.png',
                },
            };
            const client: EthereumClient = ethereumClient;
            web3Modal.value = new Web3Modal(config, client);
            emit('modal-ready', web3Modal.value);
        });
        return { web3Modal };
    },
});
</script>

<template>
<div></div>
</template>
