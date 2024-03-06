<script setup lang='ts'>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import TransactionTable from 'components/TransactionTable.vue';
import BlockField from 'components/BlockField.vue';

const $route = useRoute();
const { t: $t } = useI18n();

const block = ref(0);
const address = ref('');

watch(() => $route.query.block,
    (blockNumber) => {
        if (/\d+/g.test((blockNumber as string) ?? '')) {
            block.value = Number(blockNumber);
        }
    },
    { immediate: true },
);

watch(() => $route.query.a,
    (addr) => {
        address.value = addr as string;
    },
    { immediate: true },
);
</script>

<template>
<q-page class="c-transaction">
    <div class="q-mb-lg">
        <span class="c-transaction__header-title">{{ $t('pages.transactions.transactions') }}</span>
        <div v-if="block">
            {{ $t('pages.transactions.for_block') }}
            <BlockField :block="block"/>
        </div>

        <div v-if="address">
            {{ $t('pages.transactions.for') }}
            <router-link :to="`/address/${address}`">{{ address }}</router-link>
        </div>
    </div>

    <div class="row c-transaction__table">
        <div class="col-12 q-pb-lg">
            <q-card>
                <TransactionTable :block="block || undefined" :account-address="address" />
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

    &__header-title {
        font-size: 1.4rem;
        font-weight: bold;
    }
}
</style>
