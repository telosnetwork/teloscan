<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import { ZERO_ADDRESSES } from 'src/lib/utils';
import { useStore } from 'vuex';
import { useChainStore } from 'src/core';

const { t: $t } = useI18n();

const props = defineProps({
    trx: {
        type: Object as () => {
            parsedTransaction?: {
                name: string;
            };
            from?: string;
            value?: string;
            gasPrice?: string;
            to?: string | null;
            input?: string;
            hash?: string;
        },
        required: true,
    },
    fullText: {
        type: Boolean,
        default: false,
    },
    separateWords: {
        type: Boolean,
        default: false,
    },
    contract: {
        type: Object,
        default: () => null,
    },
    useHighlight: {
        type: Boolean,
        default: true,
    },
});

const methodName = ref('');
const nativeTooltipText = ref('');

const $store = useStore();
const setHighlightMethod = (method: string) => props.useHighlight ? $store.dispatch('general/setHighlightMethod', method) : null;
const highlightMethod = computed(() => props.useHighlight ? $store.state.general.highlightMethod : '');

const methodSignature = computed(() => {
    if (props.trx.input && props.trx.input !== '0x') {
        // the first 10 characters of the input data are the method signature, including leading '0x'
        return props.trx.input.slice(0, 10);
    }

    return '';
});
const methodNameOrSignature = computed(() => {
    if (methodName.value) {
        return methodName.value;
    }

    if (props.trx.input && props.trx.input !== '0x') {
        return methodSignature.value;
    }

    return '';
});
const displayText = computed(() => {
    try {
        let method = methodNameOrSignature.value;
        if (method && props.separateWords) {
            method = method.replace(/([A-Z])/g, ' $1').trim();
            method = method[0].toUpperCase() + method.slice(1);
        }
        return method;
    } catch (e) {
        console.error(e);
    }
    return '';
});
const propValue = computed(() => +(props.trx.value || '0x0'));

onMounted(async () => {
    await setValues();
});

const setValues = async () => {
    if (
        !props.trx.parsedTransaction
        && props.trx.from === ZERO_ADDRESSES
        && propValue.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        nativeTooltipText.value = $t('pages.transactions.native_deposit_tooltip');
        methodName.value = $t('pages.transactions.deposit_action_name');
    } else if (
        !props.trx.parsedTransaction
        && props.trx.to === ZERO_ADDRESSES
        && propValue.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        nativeTooltipText.value = $t('pages.transactions.native_withdraw_tooltip');
        methodName.value = $t('pages.transactions.withdraw_action_name');
    } else if (!props.trx.parsedTransaction && props.trx.input === '0x' && propValue.value) {
        methodName.value = $t('pages.transactions.transfer_tlos_action_name', {
            symbol: useChainStore().currentChain.settings.getSystemToken().symbol,
        });
    } else if (!props.trx.parsedTransaction && props.trx.to === null) {
        methodName.value = $t('pages.transactions.contract_deployment');
    } else if (props.trx.parsedTransaction) {
        methodName.value = props.trx.parsedTransaction.name;
    }
};
</script>

<template>
<div
    :class="{
        'c-method': true,
        'c-method--highlight': [methodName, methodSignature].includes(highlightMethod) && highlightMethod !== '',
        'c-method--full-text': fullText,
    }"
    @mouseenter="setHighlightMethod(methodName || methodSignature)"
    @mouseleave="setHighlightMethod('')"
>
    {{ displayText }}

    <q-tooltip>
        {{ nativeTooltipText || methodName || displayText }}
    </q-tooltip>
</div>
</template>

<style lang="scss">
.c-method {
    width: 150px;
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

    &--full-text {
        width: auto;
    }
}
</style>
