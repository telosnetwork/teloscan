<script setup lang='ts'>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import TransactionTable from 'components/TransactionTable.vue';
import BlockField from 'components/BlockField.vue';

const route = useRoute();

// const block = ref(0);
const block = ref(327366818);

watch(() => route.query.block,
    (blockNumber) => {
        if (typeof blockNumber === 'number'){
            block.value = blockNumber;
        }
    },
);
</script>

<template>
<q-page class="c-transaction">
    <div class="c-transaction__header">
        <span class="c-transaction__header-title">{{ $t('pages.transactions') }}</span>
        <div v-if="block" class="c-transaction__block">
            for block
            <BlockField :block="block"/>
        </div>
    </div>

    <div class="row c-transaction__table">
        <div class="col-12 q-pb-lg">
            <q-card>
                <TransactionTable/>
            </q-card>
        </div>
    </div>
</q-page>
</template>

<style lang="scss">
.c-transaction {
    --bs-gutter-x: 1.5rem;
    --bs-gutter-y: 0;
    padding-top: 35px;
    padding-right: calc(var(--bs-gutter-x) * .5);
    padding-left: calc(var(--bs-gutter-x) * .5);
    margin-right: auto;
    margin-left: auto;
    width: 100%;
    max-width: 1200px;
    &__header {
        display: flex;
        justify-content: left;
        gap: 10px;
        align-items: baseline;
        margin-bottom: 1.5rem;
        vertical-align: text-bottom;
        &-title {
            font-size: 1.4rem;
            font-weight: bold;
        }
    }
}
</style>
