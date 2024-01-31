<script>
export default {
    name: 'CustomTooltip',
    props: {
        content: {
            type: [Object, String],
            required: true,
        },
        anchor: {
            type: String,
            default: 'bottom middle',
        },
        self: {
            type: String,
            default: 'top middle',
        },
        offset: {
            type: Array,
            default: () => [14, 14],
        },
        long: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<template>
<q-tooltip
    :self="self"
    :offset="offset"
    :anchor="anchor"
    :class="(long) ? 'tooltip-long' : 'tooltip'"
>
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
