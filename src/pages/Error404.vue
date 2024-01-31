<script>
export default {
    name: 'Error404Page',
};
</script>

<template>
<div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
        <div class="c-404__404">404</div>
        <div class="text-h2 c-404__oops">{{ $t('pages.oops') }}</div>
        <q-btn
            class="q-mt-xl"
            color="white"
            text-color="blue"
            unelevated
            to="/"
            :label="$t('pages.go_home')"
            no-caps="no-caps"
        />
    </div>
</div>
</template>

<style lang="scss">
.c-404 {
    &__404 {
        font-size: 30vh;
    }

    &__oops {
        opacity: .4;
    }
}
</style>
