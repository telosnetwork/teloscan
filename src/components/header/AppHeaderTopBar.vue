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

import { useChainStore } from 'src/antelope';
import {
    IS_MAINNET,
    IS_TESTNET,
    TELOSCAN_MAINNET_URL,
    TELOSCAN_TESTNET_URL,
    // BETA_TELOSCAN_MAINNET_URL,
    // BETA_TELOSCAN_TESTNET_URL,
} from 'src/lib/chain-utils';

import AppHeaderWallet from 'components/header/AppHeaderWallet.vue';
import OutlineButton from 'components/OutlineButton.vue';
import AppSearch from 'components/AppSearch.vue';

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
    if (IS_TESTNET) {
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
    if (IS_TESTNET) {
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
    if (IS_MAINNET) {
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

function goToTeloscanMainnet() {
    if (IS_MAINNET) {
        return;
    }
    window.open(TELOSCAN_MAINNET_URL, '_blank');
}

function goToTeloscanTestnet() {
    if (IS_TESTNET) {
        return;
    }
    window.open(TELOSCAN_TESTNET_URL, '_blank');
}
</script>

<template>
<div class="c-header-top-bar">
    <div class="c-header-top-bar__inner-container">
        <div class="c-header-top-bar__left-container">
            <div v-if="IS_MAINNET" class="text-caption q-mr-md">
                <span class="c-header-top-bar__grey-text">
                    {{ $t('components.header.system_token_price', { token: systemTokenSymbol }) }}
                </span> ${{ tlosPrice }}
            </div>

            <div v-if="IS_MAINNET" class="text-caption u-flex--center-y">
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
                <img src="branding/telos.png" height="24" width="24">

                <q-menu>
                    <q-list>
                        <q-item
                            clickable
                            role="link"
                            @click="goToTeloscanMainnet"
                            @keydown.enter="goToTeloscanMainnet"
                        >
                            <q-item-section :class="IS_MAINNET ? 'text-primary' : ''">
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
                            <q-item-section :class="IS_TESTNET ? 'text-primary' : ''">
                                Telos Testnet
                            </q-item-section>
                        </q-item>
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
}
</style>
