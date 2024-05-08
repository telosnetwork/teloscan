<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onMounted,
    ref,
} from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar, useMeta } from 'quasar';

import AppHeader from 'components/header/AppHeader.vue';
import FooterMain from 'components/FooterMain.vue';

import { getBrowserName } from 'src/lib/utils';

const $route = useRoute();
const $q = useQuasar();

const scrollY = ref(0);
const footerHeight = ref(0);
const margin = ref(50);

const onHomePage = computed(() => $route.name === 'home');

useMeta({
    // sets document title
    title: 'Home Page',
    // optional; sets final title as "Index Page - My Website", useful for multiple level meta
    titleTemplate: title => `${title} - Teloscan`,

    // meta tags
    meta: {
        description: { name: 'description', content: 'Teloscan is a balzing fast block explorer for Telos EVM based on Etherscan' },
        keywords: { name: 'keywords', content: 'Telos, block, block explorer, transactions, evm, blockchain, Telos EVM' },
        equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
        // note: for Open Graph type metadata you will need to use SSR, to ensure page is rendered by the server
        ogTitle:  {
            property: 'og:title',
            content: 'Home Page', // optional; similar to title, but allows templating with other meta properties
            // optional; similar to titleTemplate, but allows templating with other meta properties
            template: content => `${content} - Teloscan`,
        },
    },

    // CSS tags
    link: {
        material: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
    },

    // JS tags
    script: {
        ldJson: {
            type: 'application/ld+json',
            innerHTML: '{ "@context": "http://schema.org" }',
        },
    },

    // <html> attributes
    htmlAttr: {
        'xmlns:cc': 'http://creativecommons.org/ns#', // generates <html xmlns:cc="http://creativecommons.org/ns#">,
        empty: undefined, // generates <html empty>
    },

    // <body> attributes
    bodyAttr: {
        'action-scope': 'xyz', // generates <body action-scope="xyz">
        empty: undefined, // generates <body empty>
    },

    // <noscript> tags
    noscript: {
        default: 'This is content for browsers with no JS (or disabled JS)',
    },
});
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
    if (!process.env.SERVER && $q.screen.width > 500) {
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
    if(process.env.SERVER){
        return false;
    }
    return scrollY.value > 300 &&
    scrollY.value < document.documentElement.scrollHeight - window.innerHeight - footerHeight.value + margin.value;
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

<style lang="scss" scoped>

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
        radial-gradient(circle at 0% 170%, $secondary, transparent 45%),
            radial-gradient(circle at 100% 130%, $secondary, transparent 30%),
            radial-gradient(circle at 100% 0%, var(--q-primary), transparent 30%),
            radial-gradient(circle at 50% 20%, $accent, transparent 70%);

        @media screen and (min-width: $breakpoint-sm-min) {
            background-image:
            radial-gradient(circle at 0% 170%, $secondary, transparent 45%),
            radial-gradient(circle at 100% 130%, $secondary, transparent 30%),
            radial-gradient(circle at 100% 0%, var(--q-primary), transparent 30%),
            radial-gradient(circle at 50% 20%, $accent, transparent 70%)
        }

        @media screen and (min-width: $breakpoint-md-min) {
            height: 400px;

            background-image:
            radial-gradient(circle at 0% 170%, $secondary, transparent 45%),
            radial-gradient(circle at 100% 130%, $secondary, transparent 30%),
            radial-gradient(circle at 100% 0%, var(--q-primary), transparent 30%),
            radial-gradient(circle at 50% 20%, $accent, transparent 70%)
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            background-image:
                radial-gradient(circle at 0% 170%, $secondary, transparent 40%),
                radial-gradient(circle at 100% 140%, $secondary, transparent 20%),
                radial-gradient(circle at 100% 0%, var(--q-primary), transparent 20%),
                radial-gradient(circle at 50% 20%, $accent, transparent 90%)
        }
    }

    &__background-bottom {
        top: 30vh;
        height: 70vh;

        background-image:
            radial-gradient(circle at 112% 75%, $accent, transparent 20%),
                radial-gradient(circle at 98% 100%, var(--q-primary), transparent 20%);

        @media screen and (min-width: $breakpoint-lg-min) {
            background-image:
                radial-gradient(circle at 112% 75%, $accent, transparent 20%),
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
