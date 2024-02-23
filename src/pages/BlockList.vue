<script setup lang="ts">
import BlockTable from 'components/BlockTable.vue';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();

</script>

<template>
<div class="c-block-list">

    <div class="c-block-list__header">
        <span class="c-block-list__header-title">{{ $t('pages.blocklist.title') }}</span>
    </div>

    <BlockTable class="c-block-list__table" title="Block List"/>

</div>
</template>

<style lang="scss">
</style>
