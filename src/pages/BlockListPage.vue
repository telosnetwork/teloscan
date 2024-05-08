<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';

import BlockTable from 'components/BlockTable.vue';

const { t: $t } = useI18n();

const showEmptyBlocks = ref(false);
useMeta({
    // sets document title
    title: 'Latest blocks',
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
});

</script>

<template>
<q-page class="c-blocks">

    <div class="c-blocks__header">
        <span class="c-blocks__header-title">{{ $t('pages.blocklist.title') }}</span>
    </div>

    <div class="c-blocks__body">
        <q-card>
            <q-toggle
                v-model="showEmptyBlocks"
                class="c-blocks__toggle"
                label="display empty blocks"
                color="primary"
                checked-icon="visibility"
                unchecked-icon="visibility_off"
            />
            <BlockTable :showEmptyBlocks='showEmptyBlocks' class="c-blocks__block-table" :title="'Block List'"/>
        </q-card>
    </div>

</q-page>
</template>

<style lang="scss">
.c-blocks {
    @include page-container;

    &__header {
        @include page-header;
        &-nav-btn {
            @include page-header-nav-btn;
        }
    }

    &__tabs {
        @include tabs-container;
    }

    &__body {
        @include page-body;
    }

    &__toggle {
        margin: .5rem;
        text-transform: capitalize;
        font-size: 0.8rem;
        display: flex !important;
        flex-flow: row-reverse;
    }
}

</style>
