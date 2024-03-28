<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';

import AppHeaderBottomBar from 'components/header/AppHeaderBottomBar.vue';
import AppHeaderTopBar from 'components/header/AppHeaderTopBar.vue';

const $q = useQuasar();
const $route = useRoute();

const hideNavTopBar = computed(() => $route.name === 'home' && $q.screen.lt.md);
</script>

<template>
<header class="c-header">
    <AppHeaderTopBar v-if="!hideNavTopBar" />
    <AppHeaderBottomBar :top-bar-hidden="hideNavTopBar" />
</header>
</template>

<style lang="scss">
.c-header {
    --background-color: white;

    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 999;
    color: var(--text-color);

    @at-root .body--dark & {
        --background-color: #{$dark};
        --highlight-color: #{$grey-9};
    }
}
</style>
