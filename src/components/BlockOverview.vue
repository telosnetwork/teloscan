<script setup lang="ts">
import { computed, defineProps, defineEmits, ref, watch } from 'vue';
import DateField from 'components/DateField.vue';
import { BlockData } from 'src/types';
import { ethers } from 'ethers';

const props = defineProps({
    data: {
        type: Object as () => BlockData | null,
        required: true,
    },
});

const emit = defineEmits(['prev-block', 'next-block', 'trx-table', 'int-trx-table']);

const blockHeight = ref(0);
const blockData = ref<BlockData | null>(null);


const showDateAge = ref(false);

// Computed properties
const timestamp = computed(() => blockData.value ? blockData.value.timestamp : 0);
const transactionsCount = computed(() => blockData.value ? blockData.value.transactionsCount : 0);
const internalTrxCount = ref(0); // Assuming this remains static for now
const size = computed(() => {
    if (blockData.value) {
        const size = ethers.BigNumber.from(blockData.value.size).toNumber();
        return `${size.toLocaleString()} bytes`;
    }
    return '0';
});
const gasUsed = computed(() => {
    if (blockData.value) {
        const gas = ethers.BigNumber.from(blockData.value.gasUsed);
        try {
            return gas.toNumber().toLocaleString();
        } catch (e) {
            console.error(e);
            return gas.toString();
        }
    }
    return '0';
});
const gasLimit = computed(() => {
    if (blockData.value) {
        const gas = ethers.BigNumber.from(blockData.value.gasLimit);
        try {
            return gas.toNumber().toLocaleString();
        } catch (e) {
            console.error(e);
            return gas.toString();
        }
    }
    return '0';
});
const nonce = computed(() => blockData.value ? blockData.value.nonce : '');
const hash = computed(() => blockData.value ? blockData.value.hash : '');
const parentHash = computed(() => blockData.value ? blockData.value.parentHash : '');



// button Actions
const emitClickOnTransactions = () => {
    emit('trx-table');
};
const emitClickOnIntTransactions = () => {
    emit('int-trx-table');
};
const prevBlock = () => {
    emit('prev-block');
};
const nextBlock = () => {
    emit('next-block');
};

watch(() => props.data, (newData) => {
    blockData.value = newData;
    const newNumber = Number(newData?.number);
    if (!isNaN(newNumber)) {
        blockHeight.value = newNumber;
    }
}, { immediate: true });

</script>


<template>
<q-card class="c-block-data__card-section">
    <div class="c-block-data__row">
        <div class="c-block-data__row-tooltip">
            <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('pages.blockpage.block_height_tooltip') }}
                </q-tooltip>
            </q-icon>
        </div>
        <div class="c-block-data__row-attribute">{{ $t('pages.blockpage.block_height') }}</div>
        <div class="c-block-data__row-value">{{ blockHeight }}</div>
        <div class="c-block-data__row-icon-btn c-block-data__row-icon-btn--left" @click="prevBlock">
            <i class="fa fa-chevron-left small"></i>
        </div>
        <div class="c-block-data__row-icon-btn c-block-data__row-icon-btn--right" @click="nextBlock">
            <i class="fa fa-chevron-right small"></i>
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__row-tooltip">
            <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('pages.blockpage.timestamp_tooltip') }}
                </q-tooltip>
            </q-icon>
        </div>
        <div class="c-block-data__row-attribute">{{ $t('pages.blockpage.timestamp') }}</div>
        <div
            class="c-block-data__row-value c-block-data__row-value--timestamp"
            @click="showDateAge = !showDateAge"
        >
            <q-icon class="c-block-data__row-value-clock-icon" name="far fa-clock">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('components.click_to_change_format') }}
                </q-tooltip>
            </q-icon>
            <DateField :epoch="Math.round(timestamp / 1000)" :force-show-age="showDateAge"/>
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__row-tooltip">
            <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('pages.blockpage.transactions_tooltip') }}
                </q-tooltip>
            </q-icon>
        </div>
        <div class="c-block-data__row-attribute">{{ $t('pages.blockpage.transactions') }}</div>
        <div class="c-block-data__row-value">
            <span class="c-block-data__row-value-link" @click="emitClickOnTransactions">
                {{ $t('pages.blockpage.count_transactions', { count: transactionsCount }) }}
            </span>
            <template v-if="internalTrxCount > 0">
                &nbsp;{{ $t('pages.blockpage.and') }}&nbsp;
                <span class="c-block-data__row-value-link" @click="emitClickOnIntTransactions">
                    {{ $t('pages.blockpage.count_int_transactions', { count: internalTrxCount }) }}
                </span>
            </template>
            {{ $t('pages.blockpage.in_this_block') }}
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__row-tooltip">
            <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('pages.blockpage.size_tooltip') }}
                </q-tooltip>
            </q-icon>
        </div>
        <div class="c-block-data__row-attribute">{{ $t('pages.blockpage.size') }}</div>
        <div class="c-block-data__row-value">{{ size }}</div>
    </div>
    <hr class="c-block-data__separator" >
    <div class="c-block-data__row">
        <div class="c-block-data__row-tooltip">
            <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('pages.blockpage.gas_used_tooltip') }}
                </q-tooltip>
            </q-icon>
        </div>
        <div class="c-block-data__row-attribute">{{ $t('pages.blockpage.gas_used') }}</div>
        <div class="c-block-data__row-value">{{ gasUsed }}</div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__row-tooltip">
            <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('pages.blockpage.gas_limit_tooltip') }}
                </q-tooltip>
            </q-icon>
        </div>
        <div class="c-block-data__row-attribute">{{ $t('pages.blockpage.gas_limit') }}</div>
        <div class="c-block-data__row-value">{{ gasLimit }}</div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__row-tooltip">
            <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('pages.blockpage.nonce_tooltip') }}
                </q-tooltip>
            </q-icon>
        </div>
        <div class="c-block-data__row-attribute">{{ $t('pages.blockpage.nonce') }}</div>
        <div class="c-block-data__row-value">{{ nonce }}</div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__row-tooltip">
            <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('pages.blockpage.hash_tooltip') }}
                </q-tooltip>
            </q-icon>
        </div>
        <div class="c-block-data__row-attribute">{{ $t('pages.blockpage.hash') }}</div>
        <div class="c-block-data__row-value">{{ hash }}</div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__row-tooltip">
            <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                <q-tooltip anchor="bottom right" self="top start">
                    {{ $t('pages.blockpage.parent_hash_tooltip') }}
                </q-tooltip>
            </q-icon>
        </div>
        <div class="c-block-data__row-attribute">{{ $t('pages.blockpage.parent_hash') }}</div>
        <div class="c-block-data__row-value">{{ parentHash }}</div>
    </div>
</q-card>

</template>


<style lang="scss">
.c-block-data {
    &__card-section {
        padding: 1.25rem!important;
        display: flex;
        flex-direction: column;
        margin-bottom: 16px;
    }
    &__row {
        display: flex;
        flex-direction: row;
        justify-content: left;
        align-items: center;
        padding: 0.5rem 0;
        gap: 5px;
    }
    &__row-tooltip {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    &__row-attribute {
        font-weight: 500;
        min-width: 230px;
    }
    &__row-value {
        margin-left: 1rem;
        &-link {
            cursor: pointer;
            color: var(--q-primary);
        }
        &--hardcoded {
            color: #999;
        }
        &--timestamp {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
        }
    }
    &__row-icon-btn {
        cursor: pointer;
        color: rgb(8, 29, 53);
        background-color: rgb(233, 236, 239);
        border: solid 1.25px rgb(233, 236, 239);
        height: 22px;
        width: 22px;
        border-radius: 6px;
        // center content with flex
        display: flex;
        justify-content: center;
        align-items: center;
        &--left {
            padding-right: 1px;
        }
        &--right {
            padding-left: 1px;
        }
    }
    &__separator {
        border: 1px solid #909090;
        margin: 1rem 0;
    }
}
</style>

