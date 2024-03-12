<script setup lang="ts">
defineProps({
    content: {
        type: String,
        required: true,
    },
});
</script>

<template>
<q-tooltip class="c-tooltip">
    <pre class="c-tooltip__content">{{ content }}</pre>
</q-tooltip>
</template>

<style lang="scss">
.c-tooltip {
    word-break: break-all;
    max-height: 100% !important;

    &__content {
        white-space: pre-wrap;
        word-break: break-all;
        font-size: 0.75em;
    }
}
</style>
