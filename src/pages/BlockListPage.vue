<script setup lang="ts">
import BlockTable from 'components/BlockTable.vue';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();

</script>

<template>
<div class="c-block-list-page">

    <div class="c-block-list-page__header">
        <span class="c-block-list-page__header-title">{{ $t('pages.blocklist.title') }}</span>
    </div>

    <BlockTable class="c-block-list-page__table" :title="'Block List'"/>

</div>
</template>

<style lang="scss">
.c-block-list-page {
    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 20px 0;
    }

    &__header-title {
        font-size: 24px;
        font-weight: 600;
    }

    &__table {
        width: 100%;
    }
}
</style>
