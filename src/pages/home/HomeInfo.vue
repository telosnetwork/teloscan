<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onBeforeUnmount,
    ref,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useQuasar } from 'quasar';

import { indexerApi } from 'src/boot/telosApi';

const $store = useStore();
const $q = useQuasar();
const { t: $t } = useI18n();
const locale = useI18n().locale.value;

let pollingInterval: null | ReturnType<typeof setInterval> = null;

const marketCap = ref('');
const transactionsCount = ref(0);

const tlosPrice = computed(() => $store.getters['chain/tlosPrice']); // no need to fetch TLOS price, it is already fetched on a timer in AppHeaderTopBar.vue
const latestBlock = computed(() => $store.getters['chain/latestBlock']);
const tlosPriceText = computed(() => `$${tlosPrice.value.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`);

onBeforeMount(() => {
    updateFigures();

    pollingInterval = setInterval(() => {
        updateFigures();
    }, 6000);
});

onBeforeUnmount(() => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});

function fetchLatestBlock() {
    $store.dispatch('chain/fetchLatestBlock');
}

async function fetchTotalTransactions() {
    const response = await indexerApi.get('/transactions?limit=0&next=-1&offset=0&includeAbi=false&includePagination=true&includeTransfers=false&full=false');
    transactionsCount.value = response.data.total_count;
}

async function fetchMarketCap() {
    const tokenId = 'telos';
    const exchangeStatsUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=USD&include_market_cap=true`;

    try {
        const response = await fetch(exchangeStatsUrl);
        const priceStats = await response.json();
        const usdMarketCap = priceStats[tokenId].usd_market_cap as number;

        marketCap.value = '$'.concat(
            usdMarketCap.toLocaleString(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        );
    } catch (e) {
        console.error('Error fetching market cap', e);
        marketCap.value = '--';
    }
}

function updateFigures() {
    fetchMarketCap();
    fetchLatestBlock();
    fetchTotalTransactions();
}
</script>

<template>
<q-card class="c-home-info">
    <q-card-section class="c-home-info__section">
        <div class="c-home-info__subsection">
            <div class="u-flex--center-y">
                <img src="branding/telos-circle-logo.svg" height="24" width="24">
                <span class="c-home-info__label">
                    {{ $t('components.tlos_price') }}
                </span>
            </div>
            {{ tlosPriceText }}
        </div>

        <q-separator class="q-my-md" />

        <div class="c-home-info__subsection">
            <span class="c-home-info__label">
                {{ $t('pages.home.market_cap') }}
            </span>
            <br>
            {{ marketCap }}
        </div>
    </q-card-section>

    <q-separator inset :vertical="$q.screen.gt.sm" />

    <q-card-section class="c-home-info__section">
        <div class="c-home-info__subsection">
            <span class="c-home-info__label">
                {{ $t('pages.home.last_finalized_block') }}
            </span>
            <br>
            {{ latestBlock }}
        </div>

        <q-separator class="q-my-md" />

        <div class="c-home-info__subsection">
            <span class="c-home-info__label">
                {{ $t('pages.home.total_transactions') }}
            </span>
            <br>
            {{ transactionsCount.toLocaleString(locale) }}
        </div>
    </q-card-section>
</q-card>
</template>

<style lang="scss">
.c-home-info {
    max-width: 800px;
    margin: 0 auto;

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

    &__label {
        font-weight: 600;
        font-size: 0.8rem;
    }
}
</style>
