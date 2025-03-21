<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onBeforeUnmount,
    ref,
    watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useQuasar } from 'quasar';

import BlockField from 'components/BlockField.vue';
import { getCore, useChainStore } from 'src/core';
import { useRoute } from 'vue-router';

const $store = useStore();
const $q = useQuasar();
const { t: $t } = useI18n();
const locale = useI18n().locale.value;

let pollingInterval: null | ReturnType<typeof setInterval> = null;

const marketCap = ref(0);
const transactionsCount = ref(0);
const initialLoadComplete = ref(false);

const showPrice = computed(() => useChainStore().currentChain.settings.getHeaderIndicators().price);
const tlosPrice = computed(() => $store.getters['chain/tlosPrice']); // no need to fetch TLOS price, it is already fetched on a timer in AppHeaderTopBar.vue
const latestBlock = ref<number>(0);
const tlosPriceText = computed(() =>
    (tlosPrice.value === 0 || !showPrice.value) ? '--' : `$${tlosPrice.value.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
);
const marketCapText = computed(() =>
    marketCap.value === 0 ? '--' : `$${marketCap.value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
);


const transactionCountText = computed(() => transactionsCount.value.toLocaleString(locale));

const fetchTlosPrice = () => $store.dispatch('chain/fetchTlosPrice');

onBeforeMount(() => {
    updateFigures();

    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    pollingInterval = setInterval(() => {
        updateFigures();
    }, 6000);
});

onBeforeUnmount(() => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});

async function fetchLatestBlock() {
    const provider = await getCore().wallets.getWeb3Provider();
    const blockNumber = await provider.getBlockNumber();
    latestBlock.value = blockNumber;
}

async function fetchTotalTransactions() {
    const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
    const response = await indexerApi.get('/v1/transactions?limit=1&offset=0&includeAbi=false&includePagination=true&includeTransfers=false&full=false');
    transactionsCount.value = response.data.total_count;
}

async function fetchMarketCap() {
    try {
        const telosApi = useChainStore().currentChain.settings.getTelosApi();
        const response = await telosApi.get('/supply/total');
        const totalSupply = response.data;
        const usdMarketCap = totalSupply * tlosPrice.value;

        marketCap.value = usdMarketCap;
    } catch (e) {
        console.error('Error fetching market cap', e);
        marketCap.value = 0;
    }
}

let milliseconds = 500;
function updateFigures() {
    const usePrice = useChainStore().currentChain.settings.getHeaderIndicators().price;
    if (usePrice) {
        fetchTlosPrice(); // This makes the Price to load before anything else
    } else {
        // this prevents the loading for the price to even show
        initialLoadComplete.value = true;
    }
    return Promise.all([
        usePrice ? fetchMarketCap() : Promise.resolve(),
        fetchLatestBlock(),
        fetchTotalTransactions(),
    ]).then(() => {
        if (tlosPrice.value > 0 && latestBlock.value > 0 && transactionsCount.value > 0) {
            initialLoadComplete.value = true;
        } else {
            if (milliseconds > 10000) {
                console.error('Failed to load all data after 10 seconds');
                initialLoadComplete.value = true;
                return;
            }
            milliseconds *= 2;
            setTimeout(() => {
                updateFigures();
            }, milliseconds);
        }
    });
}

const $route = useRoute();
const lastBlockKnown = ref<number>(0);
watch(() => $route.query, () => {
    marketCap.value = 0;
    transactionsCount.value = 0;
    initialLoadComplete.value = false;
    lastBlockKnown.value = latestBlock.value;
    updateFigures();
});

</script>

<template>
<q-card class="c-home-info">
    <q-card-section class="c-home-info__section">
        <div class="c-home-info__subsection">
            <div class="c-home-info__label-container">
                <img
                    class="c-home-info__icon"
                    :src="useChainStore().currentChain.settings.getSystemToken().logo"
                    height="14"
                    width="14"
                >
                <span class="c-home-info__label">
                    {{ $t('components.tlos_price') }}
                </span>
            </div>
            <q-skeleton v-if="tlosPrice === 0 && !initialLoadComplete" type="text" class="c-home-info__skeleton" />
            <template v-else>{{ tlosPriceText }}</template>
        </div>

        <q-separator class="q-my-md" />

        <div class="c-home-info__subsection">
            <span class="c-home-info__label">
                {{ $t('pages.home.market_cap') }}
            </span>
            <br>
            <q-skeleton v-if="marketCap === 0 && !initialLoadComplete" type="text" class="c-home-info__skeleton" />
            <template v-else>{{ marketCapText }}</template>
        </div>
    </q-card-section>

    <q-separator inset :vertical="$q.screen.gt.sm" />

    <q-card-section class="c-home-info__section">
        <div class="c-home-info__subsection">
            <span class="c-home-info__label">
                {{ $t('pages.home.last_finalized_block') }}
            </span>
            <br>
            <q-skeleton v-if="latestBlock === lastBlockKnown" type="text" class="c-home-info__skeleton" />
            <BlockField
                v-else
                class="c-home-info__number"
                :block="latestBlock.toString()"
            />
        </div>

        <q-separator class="q-my-md" />

        <div class="c-home-info__subsection">
            <span class="c-home-info__label">
                {{ $t('pages.home.total_transactions') }}
            </span>
            <br>
            <q-skeleton v-if="transactionsCount === 0" type="text" class="c-home-info__skeleton" />
            <template v-else>{{ transactionCountText }}</template>
        </div>
    </q-card-section>
</q-card>
</template>

<style lang="scss">
.c-home-info {
    max-width: 800px;
    margin: 0 auto;
    border-radius: 12px;

    @media screen and (min-width: $breakpoint-md-min) {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    &__section {
        flex: 1 1 100%;
    }

    &__subsection {
        @media screen and (min-width: $breakpoint-md-min) {
            height: 48px;
        }
    }

    &__label-container {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    &__icon {
        margin-bottom: 2px;
    }

    &__label {
        font-weight: 600;
        font-size: 0.8rem;
    }

    &__skeleton {
        height: 2rem;

        @media screen and (min-width: $breakpoint-md-min) {
            width: 50%;
        }
    }
}
</style>
