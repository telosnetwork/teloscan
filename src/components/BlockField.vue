<script>
export default {
    name: 'BlockField',
    props: {
        block: {
            type: Number,
            required: true,
        },
    },
};
</script>

<template>
<RouterLink :key="$route.path" :to="`/block/${this.block}`">
    {{ block }}
</RouterLink>
</template>
