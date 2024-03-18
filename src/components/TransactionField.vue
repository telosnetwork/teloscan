<script setup lang="ts">
import CopyButton from 'components/CopyButton.vue';
import { computed } from 'vue';

const props = defineProps({
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

const text = computed(() => {
    if (props.transactionHash) {
        const cropped = props.transactionHash.slice(0, props.truncate);
        return cropped.length < props.transactionHash.length ? `${cropped}...` : cropped;
    } else {
        return '...';
    }
});

</script>

<template>
<div class="transaction-field-container">
    <router-link :key="$route.path" :class="`text-${color}`" :to="`/tx/${transactionHash}`">
        {{ text }}
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
