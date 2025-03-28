<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onMounted,
    ref,
    watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { setCssVar, useQuasar } from 'quasar';

import AppHeader from 'components/header/AppHeader.vue';
import FooterMain from 'components/FooterMain.vue';

import { getBrowserName } from 'src/lib/utils';
import { useChainStore } from 'src/core';
import { Themes } from 'src/core/types';
import { initMultichain } from 'src/lib/multichain-utils';

const $route = useRoute();
const $router = useRouter();

const $q = useQuasar();

const scrollY = ref(0);
const footerHeight = ref(0);
const margin = ref(50);



const onHomePage = computed(() => $route.name === 'home');

onBeforeMount(() => {
    const $q = useQuasar();
    const storedDarkMode = localStorage.getItem('darkModeEnabled');

    // Check if 'darkModeEnabled' is in localStorage
    if (storedDarkMode !== null) {
        $q.dark.set(storedDarkMode === 'true');
    } else {
        // Use system preferences if there is no preference saved
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        $q.dark.set(prefersDark);
    }
});

onMounted(() => {
    if ($q.screen.width > 500) {
        footerHeight.value = document.getElementById('footer')?.offsetHeight || 0;
    }
});

function toTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
}

function scrollHandler() {
    scrollY.value = window.scrollY;
}

function showBackToTop() {
    return scrollY.value > 300 &&
    scrollY.value < document.documentElement.scrollHeight - window.innerHeight - footerHeight.value + margin.value;
}


function setTheme(): void {
    const themes = useChainStore().currentChain.themes as Themes;
    const chainThemes = useChainStore().currentChain.settings.getThemes() as Themes;
    const defaultTheme = ($q.dark.isActive ? themes.dark : themes.light) as Record<string, string>;
    const theme = ($q.dark.isActive ? chainThemes.dark : chainThemes.light) as Record<string, string>;
    const themeProps = Object.keys(theme);
    for (let themeVar of themeProps) {
        if (theme[themeVar]) {
            setCssVar(themeVar, theme[themeVar]);
        } else {
            setCssVar(themeVar, defaultTheme[themeVar]);
        }
    }
}

watch(() => $route.query.network, () => {
    setTheme();
},
{
    immediate: true,
});
watch(() => $q.dark.isActive, () => {
    setTheme();
});

onMounted(() => {
    initMultichain($router, $route);
});

// tries to detect if the browser is Safari and adds a class to the body
if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
    document.body.classList.add('is-safari');
}


</script>

<template>
<q-layout view="hhh lpr fff" :class="`c-main-layout ${getBrowserName()}`">
    <div class="c-main-layout__background-container">
        <div class="c-main-layout__background-top">
            <div class="c-main-layout__background-circle c-main-layout__background-circle--1"></div>
            <div class="c-main-layout__background-circle c-main-layout__background-circle--2"></div>
        </div>
        <div class="c-main-layout__background-bottom"></div>
    </div>

    <q-header elevated>
        <AppHeader />
    </q-header>

    <q-page-container
        :class="{
            'flex flex-center c-main-layout__page-container': true,
            'c-main-layout__page-container--home': onHomePage,
            [$route.query.network as string]: true,
        }"
    >
        <router-view />
    </q-page-container>

    <q-footer>
        <FooterMain id="footer" class="c-main-layout__footer" />
    </q-footer>

    <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
    >
        <q-btn
            v-if="showBackToTop()"
            round
            class="c-main-layout__scroll-up shadow-4"
            icon="fas fa-chevron-up"
            :text-color="$q.dark.isActive ? 'white' : 'primary'"
            :color="$q.dark.isActive ? 'primary' : 'white'"
            @click="toTop"
        />
    </transition>
</q-layout>
<q-scroll-observer @scroll="scrollHandler" />
</template>

<style lang="scss">

.c-main-layout {
    --faint-circle-color: rgba(255, 255, 255, 0.1);

    body.body--dark & {
        --faint-circle-color: rgba(100, 100, 100, 0.1);
    }

    &__background-container {
        position: fixed;
        z-index: -1;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: rgba(var(--q-primary), 0.04);

        body.body--dark & {
            background-color: rgb(28, 28, 28);
            opacity: 1;
        }
    }

    &__background-top,
    &__background-bottom {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-position: center center;
        background-size: 100% auto;
        background-repeat: no-repeat;
    }

    &__background-top {
        top: 0;
        height: 320px;
        overflow: hidden;
        background-image:
        radial-gradient(circle at 0% 170%, var(--q-secondary), transparent 45%),
            radial-gradient(circle at 100% 130%, var(--q-secondary), transparent 30%),
            radial-gradient(circle at 100% 0%, var(--q-primary), transparent 30%),
            radial-gradient(circle at 50% 20%, var(--q-accent), transparent 70%);

        @media screen and (min-width: $breakpoint-sm-min) {
            background-image:
            radial-gradient(circle at 0% 170%, var(--q-secondary), transparent 45%),
            radial-gradient(circle at 100% 130%, var(--q-secondary), transparent 30%),
            radial-gradient(circle at 100% 0%, var(--q-primary), transparent 30%),
            radial-gradient(circle at 50% 20%, var(--q-accent), transparent 70%)
        }

        @media screen and (min-width: $breakpoint-md-min) {
            height: 400px;

            background-image:
            radial-gradient(circle at 0% 170%, var(--q-secondary), transparent 45%),
            radial-gradient(circle at 100% 130%, var(--q-secondary), transparent 30%),
            radial-gradient(circle at 100% 0%, var(--q-primary), transparent 30%),
            radial-gradient(circle at 50% 20%, var(--q-accent), transparent 70%)
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            background-image:
                radial-gradient(circle at 0% 170%, var(--q-secondary), transparent 40%),
                radial-gradient(circle at 100% 140%, var(--q-secondary), transparent 20%),
                radial-gradient(circle at 100% 0%, var(--q-primary), transparent 20%),
                radial-gradient(circle at 50% 20%, var(--q-accent), transparent 90%)
        }
    }

    &__background-bottom {
        top: 30vh;
        height: 70vh;

        background-image:
            radial-gradient(circle at 112% 75%, var(--q-accent), transparent 20%),
                radial-gradient(circle at 98% 100%, var(--q-primary), transparent 20%);

        @media screen and (min-width: $breakpoint-lg-min) {
            background-image:
                radial-gradient(circle at 112% 75%, var(--q-accent), transparent 20%),
                radial-gradient(circle at 98% 100%, var(--q-primary), transparent 20%);
        }
    }

    &__background-circle {
        position: absolute;
        content: "";
        border-radius: 100%;
        border: 32px solid var(--faint-circle-color);

        &--1 {
            top: -12vh;
            right: -16vh;
            width: 45vh;
            height: 45vh;
        }

        &--2 {
            display: none;

            @media screen and (min-width: $breakpoint-md-min) {
                display: block;
                top: -50%;
                right: 0;
                left: 0;
                width: 45vh;
                height: 45vh;
                margin: 0 auto;
            }
        }
    }

    &__page-container {
        $stacked-header-height: calc(var(--top-bar-height) + var(--bottom-bar-height));

        margin: $stacked-header-height 12px 0;

        &--home {
            margin-top: var(--bottom-bar-height);

            @media screen and (min-width: $breakpoint-md-min) {
                margin-top: $stacked-header-height;
            }
        }
    }

    &__footer {
        margin-top: 40px;
        @media screen and (min-width: $breakpoint-md-min) {
            margin-top: 65px;
        }
    }

    &__scroll-up {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2001;
    }
}
</style>
