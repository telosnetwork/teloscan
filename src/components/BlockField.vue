<script setup lang="ts">
defineProps({
    block: {
        type: [Number, String],
        required: true,
    },
});
</script>

<template>
<RouterLink :key="$route.path" :to="`/block/${block}`">
    {{ block }}
</RouterLink>
</template>
