<script setup lang='ts'>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import TransactionTable from 'components/TransactionTable.vue';
import BlockField from 'components/BlockField.vue';
import { useMeta } from 'quasar';

const $route = useRoute();
const { t: $t } = useI18n();

const block = ref(0);
const address = ref('');

useMeta({
    // sets document title
    title: 'Latest transactions',
    // optional; sets final title as "Index Page - My Website", useful for multiple level meta
    titleTemplate: title => `${title} - Teloscan`,

    // meta tags
    meta: {
        description: { name: 'description', content: 'Teloscan is a balzing fast block explorer for Telos EVM based on Etherscan' },
        keywords: { name: 'keywords', content: 'Telos, block, block explorer, transactions, evm, blockchain, Telos EVM' },
        equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
        // note: for Open Graph type metadata you will need to use SSR, to ensure page is rendered by the server
        ogTitle:  {
            property: 'og:title',
            content: 'Home Page', // optional; similar to title, but allows templating with other meta properties
            // optional; similar to titleTemplate, but allows templating with other meta properties
            template: content => `${content} - Teloscan`,
        },
    },

    // CSS tags
    link: {
        material: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
    },

    // JS tags
    script: {
        ldJson: {
            type: 'application/ld+json',
            innerHTML: '{ "@context": "http://schema.org" }',
        },
    },

    // <html> attributes
    htmlAttr: {
        'xmlns:cc': 'http://creativecommons.org/ns#', // generates <html xmlns:cc="http://creativecommons.org/ns#">,
        empty: undefined, // generates <html empty>
    },

    // <body> attributes
    bodyAttr: {
        'action-scope': 'xyz', // generates <body action-scope="xyz">
        empty: undefined, // generates <body empty>
    },

    // <noscript> tags
    noscript: {
        default: 'This is content for browsers with no JS (or disabled JS)',
    },
});

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

    <div class="c-transactions__body">
        <TransactionTable :block="block || undefined" :account-address="address" />
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
        @include page-body;
    }
}
</style>
