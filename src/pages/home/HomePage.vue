<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { LatestContainerOptions } from 'src/types';

import HomeInfo from 'src/pages/home/HomeInfo.vue';
import HomeLatestDataContainer from 'src/pages/home/HomeLatestDataContainer.vue';
import HomeLatestBlocks from 'src/pages/home/HomeLatestBlocks.vue';
import HomeLatestTransactions from 'src/pages/home/HomeLatestTransactions.vue';
import AppSearch from 'src/components/AppSearch.vue';

const { t: $t } = useI18n();

const left_options = ref<LatestContainerOptions>({
    blocks: {
        title: $t('pages.home.latest_blocks'),
        footer: $t('pages.home.view_all_blocks'),
        link: 'blocks',
    },
});

const right_options = ref<LatestContainerOptions>({
    transactions: {
        title: $t('pages.home.latest_transactions'),
        footer: $t('pages.home.view_all_transactions'),
        link: 'transactions',
    },
});

</script>

<template>
<q-page class="c-home">
    <div class="c-home__top-text-row row">
        <div class="col-12 text-center">
            <h5 class="text-weight-bolder q-my-none">
                {{ $t('pages.home.telos_evm_explorer') }}
            </h5>
        </div>
    </div>
    <div class="row q-mb-xl">
        <div class="col-12 u-flex--center">
            <AppSearch :homepage-mode="true" />
        </div>
    </div>
    <div class="row q-my-xl">
        <div class="col-12">
            <HomeInfo />
        </div>
    </div>
    <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
            <HomeLatestDataContainer :options="left_options">
                <template v-slot:blocks>
                    <HomeLatestBlocks />
                </template>
            </HomeLatestDataContainer>
        </div>
        <div class="col-12 col-md-6">
            <HomeLatestDataContainer :options="right_options">
                <template v-slot:transactions>
                    <HomeLatestTransactions />
                </template>
            </HomeLatestDataContainer>
        </div>
    </div>
</q-page>
</template>

<style lang="scss">
.c-home {
    @include page-container;

    &__top-text-row {
        margin-top: 32px;
        margin-bottom: 16px;

        @media screen and (min-width: $breakpoint-md-min) {
            margin-top: 48px;
        }
    }

    &__data {
        display: flex;
        justify-content: space-between;
        margin-top: 32px;
        gap: 16px;
    }
}
</style>
