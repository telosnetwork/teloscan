<script setup lang="ts">
// src/pages/HoldersPage.vue

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChainStore } from 'src/core';
import HolderList from 'components/Token/HolderList.vue';



const { t: $t } = useI18n();
const systemToken = computed(() => useChainStore().currentChain.settings.getSystemToken());
const symbol = computed(() => systemToken.value.symbol);

</script>

<template>
<q-page class="c-holders">
    <div class="c-holders__header">
        <span class="c-holders__header-title">{{ $t('components.header.accounts_title', { symbol }) }}</span>
    </div>

    <div class="c-holders__main-container">
        <div class="c-holders__main-content">
            <HolderList
                :columns="['rank','address','tag_name','balance','percentage','txn_count']"
            />
        </div>
    </div>

</q-page>
</template>
<style lang="scss">

.c-holders {
    @include page-container;

    &__header {
        @include page-header;
        &-block-num {
            font-size: 1.5rem;
            margin-left: 10px;
        }
    }
    &__main-container {
        background: transparent !important;
    }
    &__main-content {
        padding: 0px;
        display: flex;
        flex-direction: column;
    }
}

</style>

