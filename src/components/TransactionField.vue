<script setup lang="ts">
import CopyButton from 'components/CopyButton.vue';

defineProps({
    transactionHash: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: false,
        default: 'primary',
    },
    truncate: {
        type: Number,
        required: false,
        default: 20,
    },
    copy: {
        type: Boolean,
        default: false,
    },
});
</script>

<template>
<div class="transaction-field-container">
    <router-link :key="$route.path" :class="`text-${color}`" :to="`/tx/${transactionHash}`">
        {{ transactionHash && transactionHash.slice(0,truncate) }}...
    </router-link>
    <q-tooltip>{{ transactionHash }}</q-tooltip>
    <CopyButton v-if="copy" :text="transactionHash" accompanying-text="" />
</div>
</template>

<style lang="sass">
.transaction-field-container
    display: inline-flex
    align-items: center
</style>
