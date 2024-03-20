<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onMounted,
    ref,
} from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

import AppHeader from 'components/header/AppHeader.vue';
import FooterMain from 'components/FooterMain.vue';

const $route = useRoute();
const $q = useQuasar();

const scrollY = ref(0);
const footerHeight = ref(0);
const margin = ref(50);

const onHomePage = computed(() => $route.name === 'home');

onBeforeMount(() => {
    $q.dark.set(localStorage.getItem('darkModeEnabled') !== 'false');
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

</script>

<template>
<q-layout view="hhh lpr fff" class="c-main-layout">
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
            background-color: darken($dark, 5%);
            opacity: 0.4;
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
        height: 30vh;
        overflow: hidden;
        background-image:
            radial-gradient(circle at 0% 150%, var(--q-primary), transparent 40%),
            radial-gradient(circle at 100% 100%, var(--q-primary), transparent 39%),
            radial-gradient(circle at 100% 0%, $secondary, transparent 40%),
            radial-gradient(circle at 65% 21%, $accent, transparent 40%);

        @media screen and (min-width: $breakpoint-sm-min) {
            background-image:
                radial-gradient(circle at 0% 120%, var(--q-primary), transparent 25%),
                radial-gradient(circle at 100% 100%, var(--q-primary), transparent 25%),
                radial-gradient(circle at 100% 0%, $secondary, transparent 25%),
                radial-gradient(circle at 75% 10%, $accent, transparent 25%);
        }

        @media screen and (min-width: $breakpoint-md-min) {
            height: 40vh;

            background-image:
                radial-gradient(circle at 0% 150%, var(--q-primary), transparent 20%),
                radial-gradient(circle at 100% 100%, var(--q-primary), transparent 20%),
                radial-gradient(circle at 100% 0%, $secondary, transparent 25%),
                radial-gradient(circle at 70% -10%, $accent, transparent 30%);
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            background-image:
                radial-gradient(circle at 0% 150%, var(--q-primary), transparent 20%),
                radial-gradient(circle at 100% 100%, var(--q-primary), transparent 18%),
                radial-gradient(circle at 100% 0%, $secondary, transparent 22%),
                radial-gradient(circle at 75% -10%, $accent, transparent 20%)
        }
    }

    &__background-bottom {
        top: 30vh;
        height: 70vh;

        background-image:
            radial-gradient(circle at 100% 83%, $accent, transparent 30%),
            radial-gradient(circle at 72% 90%, $secondary, transparent 36%);

        @media screen and (min-width: $breakpoint-md-min) {
            background-image:
                radial-gradient(circle at 100% 83%, $accent, transparent 20%),
                radial-gradient(circle at 80% 90%, $secondary, transparent 25%);
        }
    }

    &__background-circle {
        position: absolute;
        content: "";
        border-radius: 100%;
        border: 24px solid var(--faint-circle-color);

        &--1 {
            top: -5vh;
            right: -20vh;
            width: 40vh;
            height: 40vh;
        }

        &--2 {
            display: none;

            @media screen and (min-width: $breakpoint-md-min) {
                display: block;
                top: -50%;
                right: 0;
                left: 0;
                width: 40vh;
                height: 40vh;
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
