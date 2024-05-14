<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import { ZERO_ADDRESSES } from 'src/lib/utils';
import MethodField from 'components/MethodField.vue';
import AddressField from 'components/AddressField.vue';
import ValueField from 'components/ValueField.vue';

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

const propValue = computed(() => +(props.trx.value || '0x0'));
const cases = {
    FUNCTION_CALL: 'function-call',
    CONTRACT_CREATION: 'contract-creation',
    TLOS_TRANSFER: 'tlos-transfer',
};
const transactionCase = ref(cases.FUNCTION_CALL);

onMounted(async () => {
    await setValues();
});

const setValues = async () => {
    if (propValue.value > 0 && props.trx.input === '0x') {
        transactionCase.value = cases.TLOS_TRANSFER;
    } else if (props.trx.to === null || props.trx.to === ZERO_ADDRESSES) {
        transactionCase.value = cases.CONTRACT_CREATION;
    } else {
        transactionCase.value = cases.FUNCTION_CALL;
    }
};

</script>

<template>
<div class="c-trx-action">

    <template v-if="transactionCase === cases.CONTRACT_CREATION">
        <span class="c-trx-action__text">
            {{ $t('components.transaction.contract_deployment') }}
        </span>
    </template>

    <template v-if="transactionCase === cases.FUNCTION_CALL">
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
            :address="props.trx.from ?? ''"
            :truncate="12"
        />

        <span class="c-trx-action__text">on</span>

        <AddressField
            :address="props.trx.to ?? ''"
            :truncate="12"
        />
    </template>

    <template v-if="transactionCase === cases.TLOS_TRANSFER">
        <q-icon class="c-tlos-transfers__icon list-arrow" name="arrow_right"/>

        <span class="c-trx-action__text">Transfer</span>

        <ValueField
            :value="props.trx.value ?? '0x0'"
            :symbol="'TLOS'"
        />

        <span class="c-trx-action__text">to</span>

        <AddressField
            :address="props.trx.to ?? ''"
            :truncate="12"
        />
    </template>
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
