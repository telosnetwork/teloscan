<script setup lang="ts">
import CopyButton from 'components/CopyButton.vue';
import { computed } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
    transactionHash: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        required: false,
        default: null,
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
    useHighlight: {
        type: Boolean,
        default: false,
    },
});

const $store = useStore();
const setHighlightTx = (Trx: string) => props.useHighlight ? $store.dispatch('general/setHighlightTx', Trx) : null;
const highlightTx = computed(() => props.useHighlight ? $store.state.general.highlightTx : '');

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
<div
    class="c-transaction-field"

    @mouseover="setHighlightTx(transactionHash)"
    @mouseleave="setHighlightTx('')"
>
    <!-- only evaluate icon conditional if prop is passed -->
    <q-icon v-if="props.status !== null && !props.status" class="c-transaction-field__icon text-negative" name="far fa-times-circle">
        <q-tooltip anchor="bottom right" self="top start">
            {{ $t('components.txn_failed') }}
        </q-tooltip>
    </q-icon>
    <router-link
        :key="$route.path"
        :class="{
            [`text-${color}`]: true,
            'c-transaction-field__link': true,
            'c-transaction-field__link--highlight': highlightTx === transactionHash && highlightTx !== ''
        }"
        :to="`/tx/${transactionHash}`"
    >
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

    &__link {
        display: flex;
        align-items: center;
        gap: 4px;
        position: relative;

        &--highlight {
            background: rgba($secondary, 0.2);
            outline: 1px dashed $secondary;
            border-radius: 5px;
        }
    }

}
</style>
