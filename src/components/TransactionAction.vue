<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import { ZERO_ADDRESSES } from 'src/lib/utils';
import MethodField from 'components/MethodField.vue';
import AddressField from 'components/AddressField.vue';

const { t: $t } = useI18n();

const props = defineProps({
    highlightAddress: {
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
            value?: string;
            gasPrice?: string;
            to?: string | null;
            input?: string;
            hash?: string;
        },
        required: true,
    },
});

const emit = defineEmits(['highlight']);

const methodName = ref('');
const nativeTooltipText = ref('');

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
        methodName.value = $t('pages.transactions.transfer_tlos_action_name');
    } else if (!props.trx.parsedTransaction && props.trx.to === null) {
        methodName.value = $t('pages.transactions.contract_deployment');
    } else if (props.trx.parsedTransaction) {
        methodName.value = props.trx.parsedTransaction.name;
    }
};

function setHighlightAddress(val: string) {
    emit('highlight', val);
}
</script>

<template>
<div class="c-trx-action">

    <q-icon class="c-tlos-transfers__icon list-arrow" name="arrow_right"/>

    <span class="c-trx-action__text">Call</span>

    <MethodField
        class="c-trx-action__method"
        :separateWords="true"
        :trx="props.trx"
        :fullText="true"
    />

    <span class="c-trx-action__text">Function by</span>

    <AddressField
        :address="props.trx.from"
        :truncate="12"
        :highlightAddress="props.highlightAddress"
        @highlight="setHighlightAddress"
    />

    <span class="c-trx-action__text">on</span>

    <AddressField
        :address="props.trx.to"
        :truncate="12"
        :highlightAddress="props.highlightAddress"
        @highlight="setHighlightAddress"
    />
</div>
</template>

<style lang="scss">
.c-trx-action {
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;

    &__method {
        transform: translateY(-2px);
    }
}
</style>
