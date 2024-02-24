<script setup lang="ts">
import AppHeaderBottomBar from 'components/header/AppHeaderBottomBar.vue';
import AppHeaderTopBar from 'components/header/AppHeaderTopBar.vue';
</script>

<template>
<header class="c-header">
    <AppHeaderTopBar />
    <AppHeaderBottomBar />
</header>
</template>

<style lang="scss">
.c-header {
    $this: &;

    --top-bar-height: 48px;
    --button-height: 32px;
    --text-color: #{$dark};
    --background-color: white;
    --border-color: #{$grey-5};

    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 999;
    color: var(--text-color);

    @at-root .body--dark & {
        --background-color: #{$dark};
        --text-color: white;
        --highlight-color: #{$grey-9};
        --border-color: #{$grey-7};
    }
}
</style>
