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

const props = defineProps({
    address: {
        type: String,
        required: true,
    },
});

onMounted(async () => {
    try{
        const txnQuery = (await indexerApi.get(`address/${props.address}/transactions?limit=1`) as any).data as any;
        if (txnQuery.results.length){
            lastTxn.value = txnQuery.results[0].hash;
        }
    }catch(e){
        console.log(e);
    }
});

</script>

<template>
<div>
    <q-card>
        <q-card-section>
            More Info
        </q-card-section>
        <q-card-section>
            <div> LAST TXN SENT </div>
            <TransactionField
                color="primary"
                :transaction-hash="lastTxn"
                :truncate="18"
            />
        </q-card-section>
        <q-card-section>
            <div> FIRST TXN SENT </div>
            <TransactionField
                color="primary"
                transaction-hash="0x123456789"
                :truncate="18"
            />
        </q-card-section>
    </q-card>
</div>
</template>

<style lang="scss">
</style>
