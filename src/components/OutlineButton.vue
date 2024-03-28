<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed } from 'vue';

const $q = useQuasar();

const props = defineProps<{
    textColor: 'primary' | 'negative' | 'default';
    iconOnly?: boolean;
    highlight?: boolean;
}>();

const buttonColor = computed(() => props.highlight ? 'primary' : ($q.dark.isActive ? 'grey-7' : 'grey-5'));

</script>

<template>
<q-btn
    outline
    dense
    no-caps
    :color="buttonColor"
    :class="{
        'c-outline-button': true,
        'c-outline-button--icon-only': iconOnly,
        'c-outline-button--primary-text': textColor === 'primary',
        'c-outline-button--red-text': textColor === 'negative',
    }"
>
    <slot></slot>
</q-btn>
</template>

<style lang="scss">
.c-outline-button {
    --button-height: 32px;
    color: var(--border-color) !important;

    height: var(--button-height);
    padding: 0 12px;
    flex-shrink: 0;

    &--icon-only {
        width: var(--button-height);
        padding: 0;
    }

    .q-btn__content {
        color: var(--text-color) !important;
    }

    &--primary-text {
        .q-btn__content {
            color: var(--q-primary) !important;
        }
    }

    &--red-text {
        .q-btn__content {
            color: $negative !important;
        }
    }
}
</style>
