<script setup lang="ts">
import CopyButton from 'components/CopyButton.vue';
import { computed } from 'vue';

const props = defineProps({
    transactionHash: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true,
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
<div class="c-transaction-field">
    <q-icon v-if="!props.status" class="c-transaction-field__icon text-negative" name="far fa-times-circle">
        <q-tooltip anchor="bottom right" self="top start">
            {{ $t('components.txn_failed') }}
        </q-tooltip>
    </q-icon>
    <router-link :key="$route.path" :class="`text-${color}`" :to="`/tx/${transactionHash}`">
        {{ text }}
        <q-tooltip>{{ transactionHash }}</q-tooltip>
    </router-link>
    <CopyButton v-if="copy" :text="transactionHash" accompanying-text="" />
</div>
</template>

<style lang="scss">
.c-transaction-field{
    display: inline-flex;
    align-items: center;
    &__icon{
        margin-right: .1rem;
        padding-bottom: .05rem;
    }
}
</style>
