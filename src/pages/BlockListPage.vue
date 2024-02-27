<script setup lang="ts">
import BlockTable from 'components/BlockTable.vue';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();

</script>

<template>
<q-page class="c-block-list-page">

    <div class="c-block-list-page__header">
        <span class="c-block-list-page__header-title">{{ $t('pages.blocklist.title') }}</span>
    </div>

    <div class="row c-block-list-page__table">
        <q-card>
            <BlockTable class="c-block-list-page__block-table" :title="'Block List'"/>
        </q-card>
    </div>

</q-page>
</template>

<style lang="scss">
.c-block-list-page {
    margin: auto;
    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 20px;
    }

    &__header-title {
        font-size: 24px;
        font-weight: 600;
    }

    flex: 0 1 1200px;
    margin: auto;
    max-width: 1200px;

    &__table {
        max-width: 100vw;
        flex-direction: column;
        margin: 20px;
    }

    @media screen and (max-width: 600px) {
        &__table {
            margin: 0;
        }
    }
}
</style>
