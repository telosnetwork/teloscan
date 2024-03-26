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

import { indexerApi, telosApi } from 'src/boot/telosApi';

const $store = useStore();
const $q = useQuasar();
const { t: $t } = useI18n();
const locale = useI18n().locale.value;

let pollingInterval: null | ReturnType<typeof setInterval> = null;

const marketCap = ref(0);
const transactionsCount = ref(0);
const initialLoadComplete = ref(false);

const tlosPrice = computed(() => $store.getters['chain/tlosPrice']); // no need to fetch TLOS price, it is already fetched on a timer in AppHeaderTopBar.vue
const latestBlock = computed(() => $store.getters['chain/latestBlock']);
const tlosPriceText = computed(() => `$${tlosPrice.value.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`);
const marketCapText = computed(() =>
    marketCap.value === 0 ? '--' : `$${marketCap.value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
);
const transactionCountText = computed(() => transactionsCount.value.toLocaleString(locale));

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
    try {
        const response = await telosApi.get('/supply/total');
        const totalSupply = response.data;
        const usdMarketCap = totalSupply * tlosPrice.value;

        marketCap.value = usdMarketCap;
    } catch (e) {
        console.error('Error fetching market cap', e);
        marketCap.value = 0;
    }
}

function updateFigures() {
    return Promise.all([
        fetchMarketCap(),
        fetchLatestBlock(),
        fetchTotalTransactions(),
    ]).then(() => {
        console.log('tlosPrice', typeof tlosPrice.value, tlosPrice.value);
        if (tlosPrice.value > 0 && latestBlock.value > 0 && transactionsCount.value > 0) {
            initialLoadComplete.value = true;
        } else {
            setTimeout(() => {
                updateFigures();
            }, 500);
        }
    });
}
</script>

<template>
<q-card class="c-home-info">
    <q-card-section class="c-home-info__section">
        <div class="c-home-info__subsection">
            <div class="c-home-info__label-container">
                <img
                    class="c-home-info__icon"
                    src="branding/telos.png"
                    height="14"
                    width="14"
                >
                <span class="c-home-info__label">
                    {{ $t('components.tlos_price') }}
                </span>
            </div>
            <q-skeleton v-if="tlosPrice === 0" type="text" class="c-home-info__skeleton" />
            <template v-else>{{ tlosPriceText }}</template>
        </div>

        <q-separator class="q-my-md" />

        <div class="c-home-info__subsection">
            <span class="c-home-info__label">
                {{ $t('pages.home.market_cap') }}
            </span>
            <br>
            <q-skeleton v-if="marketCap === 0" type="text" class="c-home-info__skeleton" />
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
            <q-skeleton v-if="latestBlock === 0" type="text" class="c-home-info__skeleton" />
            <template v-else>{{ latestBlock }}</template>
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
