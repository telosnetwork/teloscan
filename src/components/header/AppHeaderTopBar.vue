<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { formatUnits } from 'ethers/lib/utils';
import { useRoute, useRouter } from 'vue-router';
import { TeloscanEVMChainSettings, evmSettings, useChainStore } from 'src/core';


import AppHeaderWallet from 'components/header/AppHeaderWallet.vue';
import OutlineButton from 'components/OutlineButton.vue';
import AppSearch from 'components/AppSearch.vue';
import { CURRENT_CONTEXT } from 'src/core/mocks';

const $route = useRoute();
const $router = useRouter();
const $q = useQuasar();
const $store = useStore();
const $i18n = useI18n();
const $t = $i18n.t;
const chainStore = useChainStore();


let pricesInterval: ReturnType<typeof setInterval> | null = null;

const locale = computed(() => $i18n.locale.value);
const hideSearchBar = computed(() => $route.name ==='home');
const systemTokenSymbol = computed(() => chainStore.currentChain.settings.getSystemToken().symbol);
const gasPriceInGwei = computed(() => {
    if (chainStore.currentChain.settings.isTestnet()) {
        return '';
    }

    const gasPrice = $store.getters['chain/gasPrice'];

    if (!gasPrice) {
        return '';
    }

    const gasGwei = Number(formatUnits(gasPrice, 'gwei'));
    const gasGweiNoDecimals = Number(gasGwei.toFixed(0));
    return gasGweiNoDecimals.toLocaleString(locale.value);
});
const tlosPrice = computed(() => {
    if (chainStore.currentChain.settings.isTestnet()) {
        return '';
    }

    const price = $store.getters['chain/tlosPrice'];
    const priceTwoDecimals = Number(Number(price).toFixed(2));
    return priceTwoDecimals.toLocaleString(locale.value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
});

onBeforeMount(() => {
    if (!chainStore.currentChain.settings.isTestnet()) {
        fetchTlosPrice();
        fetchGasPrice();
    }
});

onMounted(async () => {
    pricesInterval = setInterval(() => {
        fetchTlosPrice();
        fetchGasPrice();
    }, 6000);
});

onBeforeUnmount(() => {
    if (pricesInterval) {
        clearInterval(pricesInterval);
    }
});

const fetchTlosPrice = () => $store.dispatch('chain/fetchTlosPrice');
const fetchGasPrice = () => $store.dispatch('chain/fetchGasPrice');

function toggleDarkMode() {
    $q.dark.toggle();
    localStorage.setItem('darkModeEnabled', $q.dark.isActive.toString());
}


// Multichain
interface ChainOption {
    network: string;
    settings: TeloscanEVMChainSettings;
}

const chains = [
    {
        network: 'telos-evm',
        settings: evmSettings['telos-evm'],
    },
    {
        network: 'telos-evm-testnet',
        settings: evmSettings['telos-evm-testnet'],
    },
] as ChainOption[];

const selectedNetwork = ref<ChainOption | undefined>(undefined);
const switchChain = (network: ChainOption) => {
    selectedNetwork.value = network;
};

onMounted(() => {
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
    $router.replace({ query: { ...$route.query, network } });
    selectedNetwork.value = chains.find(chain => chain.network === network);
});

watch(selectedNetwork, () => {
    if (selectedNetwork.value) {
        chainStore.setChain(CURRENT_CONTEXT, selectedNetwork.value.network);
        // replace the url to reflect the network
        $router.replace({ query: { ...$route.query, network: selectedNetwork.value.network } });
    }
});

watch(() => chainStore.currentChain, (currentChain) => {
    selectedNetwork.value = chains.find(chain => chain.network === currentChain.settings.getNetwork());
});


</script>

<template>
<div class="c-header-top-bar">
    <div class="c-header-top-bar__inner-container">
        <div class="c-header-top-bar__left-container">
            <div v-if="!chainStore.currentChain.settings.isTestnet()" class="text-caption q-mr-md">
                <span class="c-header-top-bar__grey-text">
                    {{ $t('components.header.system_token_price', { token: systemTokenSymbol }) }}
                </span> ${{ tlosPrice }}
            </div>

            <div v-if="!chainStore.currentChain.settings.isTestnet()" class="text-caption u-flex--center-y">
                <q-icon name="fas fa-gas-pump" class="c-header-top-bar__grey-text q-mr-xs" />
                <span class="c-header-top-bar__grey-text">
                    {{ $t('components.header.gas') }}:
                </span>&nbsp;{{ gasPriceInGwei }} gwei
            </div>
        </div>

        <div class="c-header-top-bar__right-container">
            <AppSearch v-if="!hideSearchBar" />

            <OutlineButton
                text-color="primary"
                :icon-only="true"
                class="c-header-top-bar__theme-toggle"
                @click="toggleDarkMode"
            >
                <q-icon v-if="$q.dark.isActive" name="light_mode" size="16px" />
                <q-icon v-else name="far fa-moon" size="14px" />

                <q-tooltip>
                    {{ $t(`components.header.switch_to_${$q.dark.isActive ? 'light' : 'dark'}_theme`) }}
                </q-tooltip>
            </OutlineButton>

            <AppHeaderWallet v-if="$q.screen.gt.sm" />

            <OutlineButton
                v-if="$q.screen.gt.sm"
                text-color="primary"
                :icon-only="true"
            >
                <img :src="chainStore.currentChain.settings.getSmallLogoPath()" height="24" width="24">

                <q-menu>
                    <q-list>
                        <!--q-item
                            clickable
                            role="link"
                            @click="goToTeloscanMainnet"
                            @keydown.enter="goToTeloscanMainnet"
                        >
                            <q-item-section :class="chainStore.currentChain.settings.isTestnet() ? '' : 'text-primary'">
                                Telos Mainnet
                            </q-item-section>
                        </q-item>
                        <q-separator />
                        <q-item
                            clickable
                            role="link"
                            @click="goToTeloscanTestnet"
                            @keydown.enter="goToTeloscanTestnet"
                        >
                            <q-item-section :class="chainStore.currentChain.settings.isTestnet() ? 'text-primary' : ''">
                                Telos Testnet
                            </q-item-section>
                        </q-item-->

                        <template v-for="chain in chains" :key="chain.network">
                            <q-separator/>
                            <q-item
                                clickable
                                role="link"
                                @click="switchChain(chain)"
                                @keydown.enter="switchChain(chain)"
                            >
                                <q-item-section :class="selectedNetwork?.network === chain.network ? 'text-primary' : ''">
                                    <div class="c-header-top-bar__chain-option">
                                        <img :src="chain.settings.getSmallLogoPath()" height="24" width="24">
                                        <span>{{  chain.settings.getDisplay() }}</span>
                                    </div>
                                </q-item-section>
                            </q-item>
                        </template>

                    </q-list>
                </q-menu>

                <q-tooltip>
                    {{ $t('components.header.view_other_networks') }}
                </q-tooltip>
            </OutlineButton>
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-header-top-bar {
    // CSS vars defined in AppHeader.vue

    border-bottom: 1px solid var(--border-color);
    height: var(--top-bar-height);
    background-color: var(--background-color);

    &__grey-text {
        color: var(--grey-text-color);
    }

    &__inner-container {
        height: 48px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;

        @media screen and (min-width: $breakpoint-md-min) {
            justify-content: space-between;
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            padding: 0;
        }
    }

    &__left-container {
        display: none;

        @media screen and (min-width: $breakpoint-md-min) {
            width: max-content;
            display: flex;
            flex-direction: row;
            padding-left: 12px;
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            padding-left: 0;
        }
    }

    &__right-container {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        padding: 0 12px;

        @media screen and (min-width: $breakpoint-md-min) {
            width: auto;
            padding: 0;
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            padding: 0;
            width: auto;
        }
    }

    &__theme-toggle {
        display: none;

        @media screen and (min-width: $breakpoint-md-min) {
            display: inline-flex;
        }
    }

    &__chain-option {
        display: flex;
        align-items: center;
        gap: 8px;
    }
}
</style>
