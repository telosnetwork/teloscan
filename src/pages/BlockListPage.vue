<script setup lang="ts">
import BlockTable from 'components/BlockTable.vue';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();

</script>

<template>
<q-page class="c-blocks">

    <div class="c-blocks__header">
        <span class="c-blocks__header-title">{{ $t('pages.blocklist.title') }}</span>
    </div>

    <div class="c-blocks__body">
        <q-card>
            <BlockTable class="c-blocks__block-table" :title="'Block List'"/>
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
}

</style>
