<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { indexerApi } from 'src/boot/telosApi';
import { TransactionQueryData } from 'src/types/TransactionQueryData';

import TransactionField from 'components/TransactionField.vue';

const { t: $t } = useI18n();

const lastTxn = ref('...');
const firstTxn = ref('...');
const loadingComplete = ref(false);

const props = defineProps({
    address: {
        type: String,
        required: true,
    },
});

onBeforeMount(async () => {
    try{
        const lastTxnQuery = (await indexerApi.get(`address/${props.address}/transactions?limit=1&includePagination=true`) as TransactionQueryData).data;
        if (lastTxnQuery.results.length){
            lastTxn.value = lastTxnQuery.results[0].hash;
        }
        // use total count to offset query and fetch first transaction
        const offset = lastTxnQuery.total_count - 1;
        const firstTxnQuery = (await indexerApi.get(`address/${props.address}/transactions?limit=1&offset=${offset}`) as TransactionQueryData).data;
        firstTxn.value = firstTxnQuery.results[0].hash;
        loadingComplete.value = true;
    }catch(e){
        console.log(e);
    }
});

</script>

<template>
<q-card class="c-more-info">
    <q-card-section v-if="!loadingComplete" >
        <q-skeleton type="text" class="c-overview__skeleton" />
    </q-card-section>
    <q-card-section v-else>
        <div class="c-more-info__section-label">
            {{ $t('pages.last') }} {{ $t('pages.transaction_sent') }}
        </div>
        <TransactionField
            color="primary"
            :transaction-hash="lastTxn"
            :truncate="18"
            class="c-more-info__value"
        />
    </q-card-section>
    <q-card-section v-if="!loadingComplete" >
        <q-skeleton type="text" class="c-overview__skeleton" />
    </q-card-section>
    <q-card-section v-else>
        <div class="c-more-info__section-label">
            {{ $t('pages.first') }} {{ $t('pages.transaction_sent') }}
        </div>
        <TransactionField
            color="primary"
            :transaction-hash="firstTxn"
            :truncate="18"
            class="c-more-info__value"
        />
    </q-card-section>
</q-card>
</template>

<style lang="scss">
.c-more-info {
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
