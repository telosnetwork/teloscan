<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import HomeInfo from 'src/pages/home/HomeInfo.vue';
import LatestDataContainer from 'src/components/LatestDataContainer.vue';
import AppSearch from 'src/components/AppSearch.vue';
import { ref } from 'vue';
import { LatestContainerOptions } from 'src/types';

const { t: $t } = useI18n();


const options = ref<LatestContainerOptions>({
    blocks: {
        title: 'Latest Blocks',
        footer: 'View all Blocks',
        link: 'blocks',
    },
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
    <div class="row q-mt-xl">
        <div class="col-12">
            <HomeInfo />
        </div>
    </div>
    <div class="c-home__data">
        <div class="c-home__data-col">
            <LatestDataContainer :options="options">
                <template v-slot:blocks>
                    <div>Showing Latest Blocks</div>
                    <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor odio in pretium bibendum. Fusce ac felis et ipsum aliquet bibendum.</div>
                </template>
                <template v-slot:transactions>
                    <div>Showing Latest Transactions</div>
                    <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor odio in pretium bibendum. Fusce ac felis et ipsum aliquet bibendum.</div>
                </template>
            </LatestDataContainer>
        </div>
        <div class="c-home__data-col">
            <LatestDataContainer :options="options">
                <template v-slot:blocks>
                    <div>Showing Latest Blocks</div>
                    <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor odio in pretium bibendum. Fusce ac felis et ipsum aliquet bibendum.</div>
                </template>
                <template v-slot:transactions>
                    <div>Showing Latest Transactions</div>
                    <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor odio in pretium bibendum. Fusce ac felis et ipsum aliquet bibendum.</div>
                </template>
            </LatestDataContainer>
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
