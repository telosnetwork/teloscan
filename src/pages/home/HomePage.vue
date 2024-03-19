<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { LatestContainerOptions } from 'src/types';

import HomeInfo from 'src/pages/home/HomeInfo.vue';
import HomeLatestDataContainer from 'src/pages/home/HomeLatestDataContainer.vue';
import HomeLatestDataTableRow from 'src/pages/home/HomeLatestDataTableRow.vue';
import AppSearch from 'src/components/AppSearch.vue';


const { t: $t } = useI18n();


const left_options = ref<LatestContainerOptions>({
    blocks: {
        title: 'Latest Blocks',
        footer: 'View all Blocks',
        link: 'blocks',
    },
});

const right_options = ref<LatestContainerOptions>({
    transactions: {
        title: 'Latest Transactions',
        footer: 'View all Transactions',
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
                    <!-- eztodo remove eslint rule, move table to own component -->
                    <!-- eslint-disable-next-line vue/no-static-inline-styles -->
                    <table style="width: 100%; border-collapse: collapse;">
                        <HomeLatestDataTableRow v-for="index in [1, 2, 3, 4, 5, 6]" :key="index" :loading="false">
                            <template v-slot:icon>
                                <q-icon name="view_in_ar" size="24px" />
                            </template>
                            <template v-slot:column-one>
                                <span>Some text</span>
                                <br>
                                <span>Some more text</span>
                            </template>
                            <template v-slot:column-two>
                                <span>Some text</span>
                                <br>
                                <span>Some more text</span>
                            </template>
                            <template v-slot:column-three>
                                <span>Some text</span>
                                <br>
                                <span>Some more text</span>
                            </template>
                        </HomeLatestDataTableRow>
                    </table>
                </template>
            </HomeLatestDataContainer>
        </div>
        <div class="col-12 col-md-6">
            <HomeLatestDataContainer :options="right_options">
                <template v-slot:transactions>
                    <!-- eztodo remove eslint rule, move table to own component -->
                    <!-- eslint-disable-next-line vue/no-static-inline-styles -->
                    <table style="width: 100%; border-collapse: collapse;">
                        <HomeLatestDataTableRow v-for="index in [1, 2, 3, 4, 5, 6]" :key="index" :loading="true" />
                    </table>
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
