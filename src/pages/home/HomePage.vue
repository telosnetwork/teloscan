<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import HomeInfo from 'pages/home/HomeInfo.vue';
import AppSearch from 'src/components/AppSearch.vue';

const { t: $t } = useI18n();

</script>

<template>
<q-page class="c-home-page">
    <div class="row c-home-page__top-text-row">
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
</q-page>
</template>

<style lang="scss">
.c-home-page {
    flex: 0 1 1200px;
    margin: auto;
    max-width: 1200px;

    &__table {
        max-width: 100vw;
    }

    &__top-text-row {
        margin-top: 32px;
        margin-bottom: 16px;

        @media screen and (min-width: $breakpoint-md-min) {
            margin-top: 48px;
        }
    }
}
</style>
