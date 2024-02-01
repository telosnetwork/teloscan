<template>
<div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
        <div class="c-error-not-found__404">
            404
        </div>

        <div class="text-h2 c-error-not-found__text">
            Oops. Nothing here...
        </div>

        <q-btn
            class="q-mt-xl"
            color="white"
            text-color="blue"
            unelevated
            to="/"
            label="Go Home"
            no-caps
        />
    </div>
</div>
</template>

<style lang="scss">
.c-error-not-found {
    &__404 {
        font-size: 30vh;
    }

    &__text {
        opacity: .4;
    }
}
</style>
