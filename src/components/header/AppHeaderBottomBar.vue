<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

import AppHeaderButton from 'components/header/AppHeaderButton.vue';
import AppHeaderWallet from 'components/header/AppHeaderWallet.vue';
import AppHeaderLinks from 'components/header/AppHeaderLinks.vue';

const $q = useQuasar();

// data
const menuBottomBarHidden = ref(false);
const menuVisibleMobile = ref(false);

// methods
function scrollHandler(info: { direction: string; }) {
    menuBottomBarHidden.value = info.direction === 'down';
}
</script>

<template>
<!-- eztodo i18n and aria roles / labels -->

<div
    :class="{
        'c-header-bottom-bar': true,
        'c-header-bottom-bar--hidden': menuBottomBarHidden,
    }"
>
    <div class="c-header-bottom-bar__inner-container">
        <router-link to="/" class="c-header-bottom-bar__logo-container">
            <div class="c-header-bottom-bar__logo-image-container">
                <img
                    alt="Telos EVM logo eztodo"
                    src="/branding/telos-scan.png"
                    height="32"
                >
            </div>

            <span class="c-header-bottom-bar__logo-text">
                Teloscan
            </span>
        </router-link>

        <nav class="c-header-bottom-bar__right-container">
            <AppHeaderWallet v-if="$q.screen.lt.md" class="q-mr-sm" />

            <AppHeaderButton
                text-color="default"
                :icon-only="true"
                class="c-header-bottom-bar__menu-button"
                @click="menuVisibleMobile = !menuVisibleMobile"
            >
                <q-icon name="menu" size="24px" />
            </AppHeaderButton>

            <AppHeaderLinks
                :menu-visible-mobile="menuVisibleMobile"
                @close-menu="menuVisibleMobile = false"
            />
        </nav>
    </div>
</div>

<q-scroll-observer @scroll="scrollHandler" />
</template>

<style lang="scss">
.c-header-bottom-bar {
    $this: &;

    padding: 0 12px;
    position: absolute;
    top: var(--top-bar-height);
    left: 0;
    right: 0;
    height: 52px;

    background: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    transition: 0.3s ease transform;
    z-index: -1;

    @media screen and (min-width: $breakpoint-lg-min) {
        padding: 0;
    }

    &--hidden:not(:focus-within) {
        transform: translateY(-100%);
    }

    &__logo-container {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-color);
    }

    &__logo-image-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    &__logo-text {
        font-size: 1rem;
        font-weight: 700;

        @media screen and (min-width: $breakpoint-md-min) {
            font-size: 1.3rem;
        }
    }

    &__inner-container {
        max-width: 1200px;
        height: 100%;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__right-container {
        height: 100%;
        display: flex;
        align-items: center;
    }

    &__menu-button {
        @media screen and (min-width: $breakpoint-md-min) {
            display: none;
        }
    }
}
</style>
