<script>
export default {
    name: 'CustomTooltip',
    props: {
        content: {
            type: String,
            required: true,
        },
    },
};
</script>

<template>
<q-tooltip class="tooltip">
    <pre class="tooltip__content">{{ content }}</pre>
</q-tooltip>
</template>

<style lang="sass" scoped>
    .tooltip
        word-break: break-all
        max-height: 100% !important
        &_content
            white-space: pre-wrap
            word-break: break-all
            font-size: 0.75em
</style>
