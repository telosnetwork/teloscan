<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
    ref,
} from 'vue';
import { useQuasar } from 'quasar';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { formatUnits } from 'ethers/lib/utils';
import moment from 'moment';

import { getAntelope } from 'src/antelope';
import { indexerApi } from 'src/boot/telosApi';
import { ual } from 'src/boot/ual';
import { providerManager } from 'src/boot/evm';

import AppHeaderWallet from 'components/header/AppHeaderWallet.vue';
import OutlineButton from 'components/OutlineButton.vue';
import AppHeaderSearch from 'components/header/AppHeaderSearch.vue';

const $q = useQuasar();
const $store = useStore();
const { t: $t } = useI18n();

const highlightTelosMainnetLink = Number(process.env.NETWORK_EVM_CHAIN_ID) === 40;
const highlightTelosTestnetLink = Number(process.env.NETWORK_EVM_CHAIN_ID) === 41;

// data
const pricesInterval = ref<ReturnType<typeof setInterval> | null>(null);

// computed
const isNative = computed(() => $store.getters['login/isNative']);
const gasPriceInGwei = computed(() => {
    const gasPrice = $store.getters['chain/gasPrice'];

    if (!gasPrice) {
        return '';
    }

    const gasGwei = Number(formatUnits(gasPrice, 'gwei'));
    const gasGweiNoDecimals = Number(gasGwei.toFixed(0));
    return gasGweiNoDecimals.toLocaleString();
});
const tlosPrice = computed(() => {
    const price = $store.getters['chain/tlosPrice'];
    const priceTwoDecimals = Number(Number(price).toFixed(2));
    return priceTwoDecimals.toLocaleString();
});

// methods
onBeforeMount(() => {
    fetchTlosPrice();
    fetchGasPrice();
});

onMounted(async () => {
    const health = await indexerApi.get('/health');

    // eztodo move to app.vue
    if (health.data?.secondsBehind > 3) {
        let behindBy = moment(health.data.secondsBehind * 1000).utc().format('HH:mm:ss');
        if (health.data?.secondsBehind > 86400) {
            const behindByHours = Math.round(health.data.secondsBehind / 60 / 60);
            const behindByDays = Math.floor(health.data.secondsBehind / 60 / 60 / 24);
            const behindByLeft = behindByHours - (behindByDays * 24);
            const behindByLeftStr = (behindByLeft === 0)
                ? ''
                : $t('global.and') + ' ' + behindByLeft + ' ' + $t('global.hours');
            behindBy = (behindByDays > 0)
                ? behindByDays + ' ' + $t('global.days') + ' ' + behindByLeftStr
                : behindByHours + ' ' + $t('global.hours');
        }
        $q.notify({
            type: 'negative',
            timeout: 12000,
            progress: true,
            message: $t('global.not_synced'),
            caption: $t('global.data_behind_by') + ' <strong>' +
                behindBy + '</strong>. <br>' + $t('global.try_reloading'),
            html: true,
        });
    }

    // On login we must set the address and record the provider
    getAntelope().events.onLoggedOut.subscribe(() => {
        const loginData = localStorage.getItem('loginData');
        if (isNative.value) {
            if (!loginData) {
                return;
            }
            const loginObj = JSON.parse(loginData);
            const wallet = ual.getAuthenticators().availableAuthenticators.find(a => a.getName() === loginObj.provider);
            wallet?.logout();
        }
        $store.commit('login/setLogin', {});
        localStorage.removeItem('loginData');
        providerManager.setProvider(null);
    });

    pricesInterval.value = setInterval(() => {
        fetchTlosPrice();
        fetchGasPrice();
    }, 6000);
});

onBeforeUnmount(() => {
    if (pricesInterval.value) {
        clearInterval(pricesInterval.value);
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
            <div class="text-caption q-mr-md">
                <!-- eztodo get symbol from chain settings -->
                <span class="c-header-top-bar__grey-text">
                    {{ $t('components.header.system_token_price', { token: 'TLOS' }) }}
                </span> ${{ tlosPrice }}
            </div>
            <div class="text-caption u-flex--center-y">
                <q-icon name="fas fa-gas-pump" class="c-header-top-bar__grey-text q-mr-xs" />
                <span class="c-header-top-bar__grey-text">
                    {{ $t('components.header.gas') }}:
                </span>&nbsp;{{ gasPriceInGwei }} gwei
            </div>
        </div>

        <div class="c-header-top-bar__right-container">
            <AppHeaderSearch />

            <OutlineButton
                text-color="primary"
                :icon-only="true"
                class="c-header-top-bar__theme-toggle"
                @click="toggleDarkMode"
            >
                <q-icon :name="`far fa-${$q.dark.isActive ? 'moon' : 'sun'}`" size="14px" />

                <q-tooltip>
                    {{ $t(`components.header.switch_to_${$q.dark.isActive ? 'light' : 'dark'}_theme`) }}
                </q-tooltip>
            </OutlineButton>
            <!-- eztodo add network switcher -->

            <AppHeaderWallet v-if="$q.screen.gt.sm" />

            <OutlineButton
                v-if="$q.screen.gt.sm"
                text-color="primary"
                :icon-only="true"
            >
                <!-- eztodo get logo from chain settings -->
                <img src="branding/telos-circle-logo.svg" height="24" width="24">

                <q-menu>
                    <q-list>
                        <q-item clickable>
                            <q-item-section :class="highlightTelosMainnetLink ? 'text-primary' : ''">
                                Telos Mainnet
                            </q-item-section>
                        </q-item>
                        <q-separator />
                        <q-item clickable>
                            <q-item-section :class="highlightTelosTestnetLink ? 'text-primary' : ''">
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
            padding: 0 12px 0 0;
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
