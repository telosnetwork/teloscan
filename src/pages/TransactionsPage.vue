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
<q-page class="c-transactions">

    <div class="c-transactions__header">
        <span class="c-transactions__header-title">{{ $t('pages.transactions.transactions') }}</span>
        <div v-if="block">
            {{ $t('pages.transactions.for_block') }}
            <BlockField :block="block"/>
        </div>

        <div v-if="address">
            {{ $t('pages.transactions.for') }}
            <router-link :to="`/address/${address}`">{{ address }}</router-link>
        </div>
    </div>

    <div class="row">
        <div class="c-transactions__body">
            <TransactionTable :block="block || undefined" :account-address="address" />
        </div>
    </div>
</q-page>
</template>

<style lang="scss">
.c-transactions {
    @include page-container;

    &__header {
        @include page-header;
    }

    &__body {
        flex-grow: 1;
    }
}
</style>
