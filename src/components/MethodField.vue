<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { ZERO_ADDRESSES } from 'src/lib/utils';

const props = defineProps({
    highlightMethod: {
        type: String,
        required: false,
        default: '',
    },
    trx: {
        type: Object as () => {
            parsedTransaction?: {
                name: string;
            };
            from?: string;
            value?: number;
            gasPrice?: string;
            to?: string;
            input?: string;
            data?: null | string;
        },
        required: true,
    },
    contract: {
        type: Object,
        default: () => null,
    },
});

const emit = defineEmits(['highlight']);

const methodName = ref('');
const nativeTooltipText = ref('');

const methodSignature = computed(() => {
    if (props.trx.input && props.trx.input !== '0x') {
        // the first 10 characters of the input data are the method signature, including leading '0x'
        return props.trx.input.slice(0, 10);
    }

    return '';
});
const displayText = computed(() => {
    if (methodName.value) {
        return methodName.value;
    }

    if (props.trx.input && props.trx.input !== '0x') {
        return methodSignature.value;
    }

    return '';
});

onMounted(async () => {
    await setValues();
});

const setValues = async () => {
    if (
        !props.trx.parsedTransaction
        && props.trx.from === ZERO_ADDRESSES
        && props.trx.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        nativeTooltipText.value = 'Native Deposit'; // eztodo i18n
        methodName.value = 'deposit'; // eztodo i18n
    } else if (
        !props.trx.parsedTransaction
        && props.trx.to === ZERO_ADDRESSES
        && props.trx.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        nativeTooltipText.value = 'Native Withdraw'; // eztodo i18n
        methodName.value = 'withdraw'; // eztodo i18n
    } else if (!props.trx.parsedTransaction && props.trx.input === '0x' && props.trx.value) {
        methodName.value = 'TLOS Transfer'; // eztodo i18n
    } else if (!props.trx.parsedTransaction && props.trx.to === null && props.trx.data !== null) {
        methodName.value = 'Contract Deployment'; // eztodo i18n
    } else if (props.trx.parsedTransaction) {
        methodName.value = props.trx.parsedTransaction.name;
    }
};

function emitHighlight(val: string) {
    emit('highlight', val);
}
</script>

<template>
<div
    :class="{
        'c-method': true,
        'c-method--highlight': [methodName, methodSignature].includes(highlightMethod) && highlightMethod !== ''
    }"
    @mouseenter="emitHighlight(methodName || methodSignature)"
    @mouseleave="emitHighlight('')"
>
    {{ displayText }}

    <q-tooltip>
        {{ nativeTooltipText || methodName || displayText }}
    </q-tooltip>
</div>
</template>

<style lang="scss">
.c-method {
    width: 80px;
    height: 24px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    padding: 3px 4px 0;
    text-align: center;
    border-radius: 5px;
    font-size: 0.9em;
    border: 1px solid var(--border-color);

    &--highlight {
        background: rgba($secondary, 0.2);
        border: 1px dashed $secondary;
    }
}
</style>
