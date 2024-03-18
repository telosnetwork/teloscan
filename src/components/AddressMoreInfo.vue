<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

import TransactionField from 'components/TransactionField.vue';
import { onMounted, ref } from 'vue';
import { indexerApi } from 'src/boot/telosApi';

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
        debugger;
        const lastTxnQuery = (await indexerApi.get(`address/${props.address}/transactions?limit=1&includePagination=true`) as any).data as any;
        if (lastTxnQuery.results.length){
            lastTxn.value = lastTxnQuery.results[0].hash;
        }
        // use total count to offset query and fetch first transaction
        const offset = lastTxnQuery.total_count - 1;
        const firstTxnQuery = (await indexerApi.get(`address/${props.address}/transactions?limit=1&offset=${offset}`) as any).data as any;
        firstTxn.value = firstTxnQuery.results[0].hash;
    }catch(e){
        console.log(e);
    }
});

</script>

<template>
<div>
    <q-card class="c-more-info">
        <q-card-section>
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
    text-transform: uppercase;
    &__value{
        font-size: 18px;
    }
}
</style>
