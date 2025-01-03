<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
} from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { formatUnits } from 'ethers/lib/utils';
import { useRoute } from 'vue-router';
import { useChainStore } from 'src/core';


import AppHeaderWallet from 'components/header/AppHeaderWallet.vue';
import OutlineButton from 'components/OutlineButton.vue';
import AppSearch from 'components/AppSearch.vue';
import { chains, multichainSelectedNetwork, switchChain } from 'src/lib/multichain-utils';

const $route = useRoute();

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

</script>

<template>
<div class="c-header-top-bar">
    <div class="c-header-top-bar__inner-container">
        <div class="c-header-top-bar__left-container">
            <div v-if="chainStore.currentChain.settings.getHeaderIndicators().price" class="text-caption q-mr-md">
                <span class="c-header-top-bar__grey-text">
                    {{ $t('components.header.system_token_price', { token: systemTokenSymbol }) }}
                </span> ${{ tlosPrice }}
            </div>

            <div v-if="chainStore.currentChain.settings.getHeaderIndicators().gasPrice" class="text-caption u-flex--center-y">
                <q-icon name="fas fa-gas-pump" class="c-header-top-bar__grey-text q-mr-xs" />
                <span class="c-header-top-bar__grey-text">
                    {{ $t('components.header.gas') }}:
                </span>&nbsp;{{ gasPriceInGwei }} gwei
            </div>

            <div v-if="chainStore.currentChain.settings.getHeaderIndicators().testnet" class="text-caption u-flex--center-y">
                <span class="c-header-top-bar__testnet-network" > Testnet </span>
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
                        <template v-for="chain in chains" :key="chain.network">
                            <q-separator/>
                            <q-item
                                clickable
                                role="link"
                                @click="switchChain(chain)"
                                @keydown.enter="switchChain(chain)"
                            >
                                <q-item-section :class="multichainSelectedNetwork?.network === chain.network ? 'text-primary' : ''">
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

    &__testnet-network {
        display: flex;
        align-items: center;

        color: var(--grey-text-color);

        height: 32px;
        padding: 0 12px;
        flex-shrink: 0;

        border-radius: 3px;
        border: 1px solid var(--border-color);

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
