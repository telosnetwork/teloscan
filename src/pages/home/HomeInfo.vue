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
import axios from 'axios';

import { indexerApi } from 'src/boot/telosApi';

const $store = useStore();
const $q = useQuasar();
const { t: $t } = useI18n();

let pollingInterval: null | ReturnType<typeof setInterval> = null;

const marketCap = ref('');
const transactionsCount = ref('');

const tlosPrice = computed(() => $store.getters['chain/tlosPrice']);
const latestBlock = computed(() => $store.getters['chain/latestBlock']);
const tlosPriceText = computed(() => `$${tlosPrice.value}`);

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

function fetchTlosPrice() {
    $store.dispatch('chain/fetchTlosPrice');
}

function fetchLatestBlock() {
    $store.dispatch('chain/fetchLatestBlock');
}

async function fetchTotalTransactions() {
    // https://api.teloscan.io/v1/transactions?limit=0&next=-1&offset=0&includeAbi=false&includePagination=true&includeTransfers=false&full=false
    const response = await indexerApi.get('/transactions?limit=0&next=-1&offset=0&includeAbi=false&includePagination=true&includeTransfers=false&full=false');
    transactionsCount.value = response.data.total_count;
}

async function fetchMarketCap() {
    console.log('test');
}

// type DateTuple = [number | string, number]

interface PriceChartData {
  lastUpdated: number;
  tokenPrice: number;
  dayChange: number;
  dayVolume: number;
  marketCap: number;
//   prices: DateTuple[];
}

interface PriceStats {
  data: {
    [tokenId: string]: {
      last_updated_at: number;
      usd: number;
      usd_24h_change: number;
      usd_24h_vol: number;
      usd_market_cap: number;
    };
  };
}

// interface PriceHistory {
//   data: {
//     prices: DateTuple[];
//   };
// }

const getCoingeckoExchangeStatsUrl = (tokenId: string): string => `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=USD&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;

async function getCoingeckoPriceChartData(
    tokenId: string,
): Promise<PriceChartData> {
    const exchangeStatsUrl = getCoingeckoExchangeStatsUrl(tokenId);
    // const priceHistoryUrl = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=USD&days=1`;  // &interval=hourly` - restore if when enterprise plan enabled;

    const priceStats: PriceStats = await axios.get(exchangeStatsUrl);

    return {
        lastUpdated: priceStats.data[tokenId].last_updated_at,
        tokenPrice: priceStats.data[tokenId].usd,
        dayChange: priceStats.data[tokenId].usd_24h_change,
        dayVolume: priceStats.data[tokenId].usd_24h_vol,
        marketCap: priceStats.data[tokenId].usd_market_cap,
        // prices: priceHistory.data.prices,
    };
}

function updateFigures() {
    fetchTlosPrice();
    fetchMarketCap();
    fetchLatestBlock();
    fetchTotalTransactions();

    getCoingeckoPriceChartData('telos').then((data) => {
        marketCap.value = Number(Number(data.marketCap).toFixed(2)).toLocaleString();
    });
}

</script>

<template>
<q-card class="c-home-info">
    <q-card-section class="c-home-info__section">
        <div class="u-flex--center-y">
            <img src="branding/telos-circle-logo.svg" height="24" width="24">
            <span class="c-home-info__label">
                {{ $t('components.tlos_price') }}
            </span>
        </div>
        {{ tlosPriceText }}
    </q-card-section>

    <q-separator inset :vertical="$q.screen.gt.sm" />

    <q-card-section class="c-home-info__section">
        <span class="c-home-info__label">
            Market Cap
        </span>
        <br>
        ${{ marketCap }}
    </q-card-section>

    <q-separator inset :vertical="$q.screen.gt.sm" />

    <q-card-section class="c-home-info__section">
        <span class="c-home-info__label">
            Last Finalized Block
        </span>
        <br>
        {{ latestBlock }}
    </q-card-section>

    <q-separator inset :vertical="$q.screen.gt.sm" />

    <q-card-section class="c-home-info__section">
        <span class="c-home-info__label">
            Total Transactions
        </span>
        <br>
        {{ transactionsCount.toLocaleString() }}
    </q-card-section>
</q-card>

<div v-if="false" class="row homeInfo">
    <div class="col q-pa-md">
        <div class="row items-center">
            <div class="col-2"></div>
            <div class="col-2">
                <!-- <img :src="exchangeImage" width="40"> -->
            </div>
            <div class="col-8 q-pl-sm">
                <div class="col-12">
                    <div class="column text-subtitle2">{{ $t('components.tlos_price') }}</div>
                </div>
                <div class="col-12">
                    <div class="column text-h6 text-weight-bold">$ {{ tlosPrice }}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="col q-pa-md">
        <div class="row items-center">
            <div class="col-2"></div>
            <div class="col-2">
                <!-- <img :src="blockImage" width="40"> -->
            </div>
            <div class="col-8 q-pl-sm">
                <div class="col-12">
                    <div class="column text-subtitle2">{{ $t('components.latest_block') }}</div>
                </div>
                <div class="col-12">
                    <div class="column text-h6 text-weight-bold">{{ latestBlock }}</div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-home-info {
    @media screen and (min-width: $breakpoint-md-min) {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 0 auto;
    }

    &__section {
        flex: 1 1 100%;
    }

    &__label {
        font-weight: 600;
        font-size: 0.8rem;
    }
}
</style>
