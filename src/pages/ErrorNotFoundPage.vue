<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import OutlineButton from 'src/components/OutlineButton.vue';

const $router = useRouter();
const { t: $t } = useI18n();

function goHome() {
    $router.push({ name: 'home' });
}
</script>

<template>
<div class="c-404">
    <div class="row q-mb-sm">
        <div class="col-12 text-center">
            <h1 class="c-404__title">
                {{ $t('pages.error.title') }}
            </h1>
        </div>
    </div>

    <div class="row q-mb-lg">
        <div class="col-12 text-center">
            {{ $t('pages.error.subtitle') }}
        </div>
    </div>

    <div class="row">
        <div class="col-12">
            <OutlineButton
                text-color="default"
                role="link"
                @click="goHome"
            >
                {{ $t('pages.go_home') }}
            </OutlineButton>
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-404 {
    height: 70vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &__title {
        font-size: 1.4rem;
        font-weight: bold;
        margin: 0;
        line-height: 1.2;
    }
}
</style>
