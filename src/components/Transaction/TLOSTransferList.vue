<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import AddressField from 'components/AddressField.vue';
import ValueField from 'components/ValueField.vue';

import { EvmTransactionExtended } from 'src/types';
import { getParsedInternalTransactions } from 'src/lib/transaction-utils';
import { useChainStore } from 'src/core';


const { t: $t } = useI18n();
const loading = ref(false);
const parsedItxs = ref<unknown []>([]);
const itxs = ref<unknown []>([]);

interface TLOSTransfer {
    from: string;
    to: string;
    value: string;
    token: {
        symbol: string;
        decimals: number;
    };
}

const props = defineProps({
    transaction: {
        type: Object as PropType<EvmTransactionExtended>,
        required: true,
    },
    highlightAddress: {
        type: String,
        required: false,
        default: '',
    },
});

const emit = defineEmits(['highlight', 'transfers-count']);

const tlos_transfers  = ref<TLOSTransfer[]>([]);

const loadTransfers = async () => {

    loading.value = true;
    const result = await getParsedInternalTransactions(props.transaction.hash, $t);
    parsedItxs.value = result.parsedItxs;
    itxs.value = result.itxs;
    loading.value = false;

    tlos_transfers.value = result.parsedItxs
        .map((itx: any, i: number) => ({ ...itx, index: i }))
        .filter((itx: any) => itx.name === $t('components.transaction.tlos_transfer', {
            symbol: useChainStore().currentChain.settings.getSystemToken().symbol,
        }))
        .map((itx: any) => ({
            from: itx.from,
            to: itx.to,
            value: (result.itxs[itx.index] as {action:{value:string}}).action.value,
            token: {
                symbol: useChainStore().currentChain.settings.getSystemToken().symbol,
                decimals: 18,
            },
        }));

    emit('transfers-count', tlos_transfers.value.length);
};

watch(() => props.transaction, async (newTrx) => {
    if (newTrx) {
        await loadTransfers();
    }
}, { immediate: true });


</script>


<template>
<div class="c-tlos-transfers">
    <div
        v-for="(transfer, index) in tlos_transfers"
        :key="index"
        class="c-tlos-transfers__row"
    >
        <q-icon class="c-tlos-transfers__icon list-arrow" name="arrow_right"/>
        <div class="c-tlos-transfers__cell c-tlos-transfers__cell--a">
            <strong> {{ $t('components.transaction.from') }} </strong>
            <AddressField
                copy
                :address="transfer.from"
                :truncate="15"
            />
        </div>
        <div class="c-tlos-transfers__cell c-tlos-transfers__cell--b">
            <strong>{{ $t('components.transaction.to') }}</strong>
            <AddressField
                copy
                :address="transfer.to"
                :truncate="15"
            />
        </div>
        <div class="c-tlos-transfers__cell c-tlos-transfers__cell--c">
            <strong>{{ $t('components.nfts.amount') }}</strong>
            <ValueField
                :value="transfer.value"
                :symbol="transfer.token.symbol"
                :decimals="transfer.token.decimals"
            />
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-tlos-transfers {
    max-height: 200px;
    overflow-y: auto;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    @include scroll-bar;

    &__row {
        grid-template-rows: auto;
        grid-auto-columns: 19px 1fr;
        grid-template:
            'icon a'
            'icon b'
            'icon c';
        display: grid;

        & + & {
            margin-top: 10px;
        }
    }

    &__icon {
        grid-area: icon;
    }
    &__cell {
        display: flex;
        gap: 5px;
        &--a {
            grid-area: a;
        }
        &--b {
            grid-area: b;
        }
        &--c {
            grid-area: c;
        }
    }

    @media screen and (min-width: $breakpoint-sm-min) {
        display: flex;
        flex-direction: column;
        gap: 5px;
        overflow-x: hidden;
        &__row {
            display: flex;
            gap: 5px;
            align-items: baseline;
        }
        &__cell {
            display: flex;
            gap: 5px;
            align-items: flex-start;
        }
    }
}

</style>
