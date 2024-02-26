<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed } from 'vue';

const $q = useQuasar();

defineProps<{
    textColor: 'primary' | 'negative' | 'default';
    iconOnly?: boolean;
}>();

// computed
const buttonColor = computed(() => $q.dark.isActive ? 'grey-7' : 'grey-5');

</script>

<template>
<q-btn
    outline
    dense
    no-caps
    :color="buttonColor"
    :class="{
        'c-app-header-button': true,
        'c-app-header-button--icon-only': iconOnly,
        'c-app-header-button--primary-text': textColor === 'primary',
        'c-app-header-button--red-text': textColor === 'negative',
    }"
>
    <slot></slot>
</q-btn>
</template>

<style lang="scss">
.c-app-header-button {
    --button-height: 32px;

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
            color: $primary !important;
        }
    }

    &--red-text {
        .q-btn__content {
            color: $negative !important;
        }
    }
}
</style>
