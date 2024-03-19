<script setup lang="ts">
defineProps<{
    loading: boolean;
}>();
</script>

<template>
<div
    :class="{
        'c-latest-data-row': true,
        'c-latest-data-row--loading': loading
    }"
>
    <template v-if="loading">
        <div>
            <q-skeleton type="rect" size="48px" />
        </div>
        <div>
            <q-skeleton type="rect" height="22px" class="q-mb-xs" />
            <q-skeleton type="rect" height="22px" />
        </div>
        <div>
            <q-skeleton type="rect" height="22px" class="q-mb-xs" />
            <q-skeleton type="rect" height="22px" />
        </div>
        <div>
            <q-skeleton type="rect" height="22px" class="q-mb-xs" />
            <q-skeleton type="rect" height="22px" />
        </div>
    </template>
    <template v-else>
        <div class="c-latest-data-row__column-one">
            <slot name="icon">
            </slot>
        </div>
        <div class="c-latest-data-row__column-two">
            <slot name="column-one">
            </slot>
        </div>
        <div class="c-latest-data-row__column-three">
            <slot name="column-two">
            </slot>
        </div>
        <div class="c-latest-data-row__column-four">
            <slot name="column-three">
            </slot>
        </div>
    </template>
</div>

</template>

<style lang="scss">
.c-latest-data-row {
    $this: &;

    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 0;

    @media screen and (min-width: $breakpoint-lg-min) {
        flex-direction: row;
        align-items: center;
    }

    &__column-one {
        display: none;
        justify-content: center;
        align-items: center;
        height: 48px;
        width: 48px;
        background-color: $grey-3;
        border-radius: 12px;

        body.body--dark & {
            background-color: $grey-9;
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            display: flex;
        }
    }

    &__column-two {
        @media screen and (min-width: $breakpoint-lg-min) {
            width: 38%;
        }
    }

    &__column-three {
        @media screen and (min-width: $breakpoint-lg-min) {
            width: 38%;
            flex-grow: 1;
        }
    }

    &__column-four {
        @media screen and (min-width: $breakpoint-lg-min) {
            width: 20%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
}
</style>
