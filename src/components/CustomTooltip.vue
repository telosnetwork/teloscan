<script>
export default {
    name: 'CustomTooltip',
    props: {
        content: {
            type: [Object, String],
            required: true,
        },
        long: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<template>
<q-tooltip :class="(long) ? 'tooltip-long' : 'tooltip'">
    <span class="tooltip-content">{{ content }}</span>
</q-tooltip>
</template>

<style lang="sass">
    .tooltip-long
        word-break: break-all
        max-height: 100% !important
        .tooltip-content
            font-size: 0.7em
            white-space: pre-wrap
            word-break: break-all
</style>
