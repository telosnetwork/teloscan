<script lang="ts" setup>
import { onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { InternalTransactionQueryData, TransactionQueryData } from 'src/types/TransactionQueryData';

import TransactionField from 'components/TransactionField.vue';
import { useChainStore } from 'src/core';
import { useRoute } from 'vue-router';

const route = useRoute();


const { t: $t } = useI18n();

const lastTxn = ref('...');
const firstTxn = ref('...');
const noTrxYet = ref(false);
const loadingComplete = ref(false);
const isInternal = ref(false);

const props = defineProps({
    address: {
        type: String,
        required: true,
    },
});

const updateData = async () => {
    // Fetch internal transactions https://api.teloscan.io/v1/address/0x2E2F83DF7061561C4a29bD155B8f65674bFa31C9/internal?limit=25&offset=0&sort=desc&includeAbi=1&full=1&includePagination=true
    loadingComplete.value = false;
    const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
    try{
        // We first try to fetch the first transaction from transaction history
        const lastTxnQuery = (await indexerApi.get(`v1/address/${props.address}/transactions?limit=1&includePagination=true`) as TransactionQueryData).data;

        if (lastTxnQuery.total_count > 0) {
            // There are transactions in the history, so we take the first one
            lastTxn.value = lastTxnQuery.results[0].hash;
            // use total count to offset query and fetch first transaction
            const offset = lastTxnQuery.total_count - 1;
            const firstTxnQuery = (await indexerApi.get(`v1/address/${props.address}/transactions?limit=1&offset=${offset}`) as TransactionQueryData).data;
            firstTxn.value = firstTxnQuery.results[0].hash;
        } else {
            // There are no transactions in the history, so we try to fetch the first internal transaction
            const internalTxnQuery = (await indexerApi.get(`v1/address/${props.address}/internal?limit=1&includePagination=true`) as InternalTransactionQueryData).data;
            if (internalTxnQuery.total_count > 0) {
                // There are internal transactions in the history, so we take the first one
                lastTxn.value = internalTxnQuery.results[0].transactionHash;
                // use total count to offset query and fetch first transaction
                const offset = internalTxnQuery.total_count - 1;
                const firstTxnQuery = (await indexerApi.get(`v1/address/${props.address}/internal?limit=1&offset=${offset}`) as InternalTransactionQueryData).data;
                firstTxn.value = firstTxnQuery.results[0].transactionHash;
                isInternal.value = true;
            } else {
                // There are no transactions in the history, so we set the flag
                noTrxYet.value = true;
            }
        }
        loadingComplete.value = true;
    } catch(e) {
        console.error(e);
    }
};

onBeforeMount(async () => {
    updateData();
});

watch(() => route.query.network,
    () => {
        updateData();
    },
);

</script>

<template>
<q-card class="c-address-more-info">
    <q-card-section v-if="!loadingComplete" >
        <q-skeleton type="text" class="c-overview__skeleton" />
    </q-card-section>
    <q-card-section v-else-if="noTrxYet" >
        <div class="c-address-more-info__section-label">
            {{ $t('pages.no_transactions_yet') }}
        </div>
    </q-card-section>
    <q-card-section v-else>
        <div class="c-address-more-info__section-label">
            {{ $t('pages.last') }} {{ isInternal ? $t('pages.int_transaction_sent') : $t('pages.transaction_sent') }}
        </div>
        <TransactionField
            color="primary"
            :transaction-hash="lastTxn"
            :truncate="18"
            class="c-address-more-info__value"
        />
    </q-card-section>
    <q-card-section v-if="!loadingComplete" >
        <q-skeleton type="text" class="c-overview__skeleton" />
    </q-card-section>
    <q-card-section v-else-if="!noTrxYet">
        <div class="c-address-more-info__section-label">
            {{ $t('pages.first') }} {{ isInternal ? $t('pages.int_transaction_sent') : $t('pages.transaction_sent') }}
        </div>
        <TransactionField
            color="primary"
            :transaction-hash="firstTxn"
            :truncate="18"
            class="c-address-more-info__value"
        />
    </q-card-section>
</q-card>
</template>

<style lang="scss">
.c-address-more-info {
    height:100%;
    &__section-label {
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: capitalize;
    }
    &__skeleton {
        height: 2rem;

        @media screen and (min-width: $breakpoint-md-min) {
            width: 50%;
        }
    }
}
</style>
