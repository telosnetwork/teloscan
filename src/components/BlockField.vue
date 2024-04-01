<script setup lang="ts">
defineProps({
    block: {
        type: Number,
        required: true,
    },
});
</script>

<template>
<RouterLink :key="$route.path" :to="`/block/${block}`">
    {{ block }}
</RouterLink>
</template>
