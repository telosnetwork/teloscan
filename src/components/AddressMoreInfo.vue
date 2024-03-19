<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { indexerApi } from 'src/boot/telosApi';
import { TransactionQueryData } from 'src/types/TransactionQueryData';

import TransactionField from 'components/TransactionField.vue';

const { t: $t } = useI18n();

const lastTxn = ref('...');
const firstTxn = ref('...');

const props = defineProps({
    address: {
        type: String,
        required: true,
    },
});

onMounted(async () => {
    try{
        const lastTxnQuery = (await indexerApi.get(`address/${props.address}/transactions?limit=1&includePagination=true`) as TransactionQueryData).data;
        if (lastTxnQuery.results.length){
            lastTxn.value = lastTxnQuery.results[0].hash;
        }
        // use total count to offset query and fetch first transaction
        const offset = lastTxnQuery.total_count - 1;
        const firstTxnQuery = (await indexerApi.get(`address/${props.address}/transactions?limit=1&offset=${offset}`) as TransactionQueryData).data;
        firstTxn.value = firstTxnQuery.results[0].hash;
    }catch(e){
        console.log(e);
    }
});

</script>

<template>
<div>
    <q-card class="c-more-info">
        <q-card-section class="c-more-info__header">
            {{ $t('pages.more_info') }}
        </q-card-section>
        <q-card-section>
            <div>
                {{ $t('pages.last') }} {{ $t('pages.transaction_sent') }}
            </div>
            <TransactionField
                color="primary"
                :transaction-hash="lastTxn"
                :truncate="18"
                class="c-more-info__value"
            />
        </q-card-section>
        <q-card-section>
            <div>
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
</div>
</template>

<style lang="scss">
.c-more-info{
    height:100%;
    text-transform: uppercase;

    &__value{
        font-size: 18px;
    }
    &__header {
        font-size: 18px;
        font-weight: 600;
    }
}
</style>
