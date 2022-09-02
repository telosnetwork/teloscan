<script>
export default {
    name: 'BlockField',
    props: {
        block: {
            type: Number,
            required: true,
        },
    },
}
</script>

<template lang="pug">
router-link(:to="`/block/${this.block}`" :key="$route.path") {{ block }}
</template>
