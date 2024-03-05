<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ZERO_ADDRESSES } from 'src/lib/utils';

const props = defineProps({
    highlightMethod: {
        type: String,
        required: false,
        default: '',
    },
    trx: {
        type: Object as () => {
            parsedTransaction?: any;
            from?: string;
            value?: number;
            gasPrice?: string;
            to?: string;
            input?: string;
            data?: any
        },
        required: true,
    },
    contract: {
        type: Object,
        default: () => null,
    },
    shortenSignature: Boolean,
    shortenName: Boolean,
});

const emit = defineEmits(['highlight']);

const expand = ref(false);
const name = ref('');
const fullName = ref('');
const icon = ref('');
const iconTooltip = ref('');

onMounted(async () => {
    await setValues();
});

const toggle = () => {
    expand.value = !expand.value;
};

const setValues = async () => {
    if (
        !props.trx.parsedTransaction
        && props.trx.from === ZERO_ADDRESSES
        && props.trx.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        icon.value = 'keyboard_double_arrow_down';
        iconTooltip.value = 'Native Deposit'; // Use your translation function or method
        fullName.value = 'deposit';
    } else if (
        !props.trx.parsedTransaction
        && props.trx.to === ZERO_ADDRESSES
        && props.trx.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        icon.value = 'keyboard_double_arrow_up';
        iconTooltip.value = 'Native Withdraw'; // Use your translation function or method
        fullName.value = 'withdraw';
    } else if (!props.trx.parsedTransaction && props.trx.input === '0x' && props.trx.value) {
        fullName.value = 'TLOS Transfer'; // Use your translation function or method
    } else if (!props.trx.parsedTransaction && props.trx.to === null && props.trx.data !== null) {
        fullName.value = 'Contract Deployment'; // Use your translation function or method
    } else if (props.trx.parsedTransaction) {
        fullName.value = props.trx.parsedTransaction.name;
    }

    name.value = (props.shortenName && fullName.value.length > 7)
        ? `${fullName.value.slice(0, 7)}...`
        : fullName.value;
};

function emitHighlight(val: string) {
    emit('highlight', val);
}
</script>

<template>
<div
    class="c-method"
    :class="{'c-method--highlight': highlightMethod === name && highlightMethod !== ''}"
    @mouseover="emitHighlight(name)"
    @mouseleave="emitHighlight('')"
>
    <span v-if="name">
        <span class="flex items-center">
            <span v-if="icon" class="c-method__icon">
                <q-icon :name="icon" />
                <q-tooltip v-if="iconTooltip">
                    {{ iconTooltip }}
                </q-tooltip>
            </span>
            <span>
                {{ name }}
            </span>
        </span>
        <q-tooltip v-if="shortenName && fullName.length > 11" anchor="center middle" self="center middle">
            {{ fullName }}
        </q-tooltip>
    </span>
    <span v-else-if="trx.input && trx.input !== '0x'" :class="shortenSignature && 'clickable'">
        <span v-if="!expand" class="text-grey" @click="shortenSignature && toggle()">
            {{
                trx.input.length > 7
                    && (shortenSignature || shortenName) ?
                        `${trx.input.slice(0,7)}...` :
                        trx.input
            }}
        </span>
        <q-tooltip v-if="shortenSignature && !expand">
            {{ $t('components.click_to_expand') }}
        </q-tooltip>
        <span
            v-if="shortenSignature && expand"
            class="word-break"
            anchor="center middle"
            self="center middle"
            @click="toggle()"
        >
            {{ trx.input }}
        </span>
    </span>
</div>
</template>

<style lang="scss">
.c-method {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    padding: 3px 6px;
    border-radius: 5px;
    font-size: 0.9em;
    border: 1px solid var(--border-color);

    &--highlight {
        background: rgba($secondary, 0.2);
        outline: 1px dashed $secondary;
    }

    &__icon {
        background: var(--q-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 4px;
        width: 16px;
        line-height: 16px;
        height: 16px;
        text-align: center;
        border-radius: 100%;
        color: white;
    }
}
</style>
