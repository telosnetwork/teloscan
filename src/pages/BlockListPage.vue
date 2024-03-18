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

    <div class="row c-blocks__table">
        <q-card>
            <BlockTable class="c-blocks__block-table" :title="'Block List'"/>
        </q-card>
    </div>

</q-page>
</template>

<style lang="scss">

// ------------------------
// This code is copied from src/styles/mixins.scss on Global Layout PR: https://github.com/telosnetwork/teloscan/pull/566
// Once that PR is merged, I will remove this code and import the mixins from the global file
@mixin page-container {
    padding-top: 35px;
    margin-right: auto;
    margin-left: auto;
    width: 100%;
    max-width: 1200px;
}

@mixin page-header {
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

@mixin page-header-nav-btn {
    cursor: pointer;
    height: 22px;
    width: 22px;
    color: white;
    background-color: $grey;
    border: solid 1.25px $grey;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    &--left {
        padding-right: 1px;
    }
    &--right {
        padding-left: 1px;
    }
    .q-dark & {
        color: rgb(8, 29, 53);
    }
}

@mixin tabs-container {
    display: inline-flex;
    gap: 1rem;
    &-content {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
    }
    &-tab {
        padding: 0px 20px;
        min-height: 35px !important;
        cursor: pointer;
        border-radius: 5px;
        text-transform: none;
        color: var(--text-color);
        background-color: var(--tab-bg-color);

        &--active {
            color: var(--active-tab-text-color);
            background-color: var(--active-tab-bg-color);
        }
    }
}
// ------------------------


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

    &__table {
        max-width: 100vw;
        flex-direction: column;
    }

    @media screen and (max-width: 600px) {
        &__table {
            margin: 0;
        }
    }
}

</style>
