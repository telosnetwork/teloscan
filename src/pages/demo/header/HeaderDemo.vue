<template>
<div class="c-header-demo">
    <div class="row q-mb-lg">
        <div class="col-12">
            <div class="c-header-demo__container-mobile">
                <app-header />
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-12">
            <div class="c-header-demo__container-desktop">
                <app-header />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import AppHeader from 'components/header/AppHeader.vue';

export default {
    name: 'HeaderDemo',
    components: {
        AppHeader,
    },
}
</script>

<style lang="scss">
.c-header-demo {
    &__container-mobile,
    &__container-desktop {
        border: 1px solid black;
        background: aliceblue;
        position: relative;

        // create new stacking context to force fixed-position header to be contained in frame
        transform: translate(0, 0);

        @at-root .body--dark & {
            background: $dark;
            border-color: white;
        }
    }

    &__container-mobile {
        height: 600px;
        width: 320px;
        margin: auto;
    }

    &__container-desktop {
        display: none;
        width: 1920px;
        height: 1080px;
    }
}
</style>
