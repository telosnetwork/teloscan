<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

import TransactionField from 'components/TransactionField.vue';

const { t: $t } = useI18n();

const props = defineProps({
    firstTxn: {
        type: Object,
        required: false,
    },
    lastTxn: {
        type: Object,
        required: false,
    },
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
                transaction-hash="0x123456789"
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
