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

// Computed properties
const timestamp = computed(() => blockData.value ? blockData.value.timestamp : 0);
const transactionsCount = computed(() => blockData.value ? blockData.value.transactionsCount : 0);
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
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blockoverview.block_height_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blockoverview.block_height') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ blockHeight }}</div>
            <div class="c-block-data__row-icon-btn c-block-data__row-icon-btn--left" @click="prevBlock">
                <i class="fa fa-chevron-left small"></i>
            </div>
            <div class="c-block-data__row-icon-btn c-block-data__row-icon-btn--right" @click="nextBlock">
                <i class="fa fa-chevron-right small"></i>
            </div>
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blockoverview.timestamp_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blockoverview.timestamp') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value c-block-data__row-value--timestamp">
                <q-icon class="c-block-data__row-value-clock-icon" name="far fa-clock" />
                <span class="c-block-data__row-date-field"><DateField
                    class="c-block-data__row-value-clock-ago"
                    :epoch="Math.round(timestamp / 1000)"
                    :force-show-age="true"
                /></span>
                <span class="c-block-data__row-date-field">(<DateField
                    class="c-block-data__row-value-clock-time"
                    :epoch="Math.round(timestamp / 1000)"
                    :force-show-age="false"
                    :utc-use-parentheses="false"
                />)</span>
            </div>
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blockoverview.transactions_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blockoverview.transactions') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">
                <span class="c-block-data__row-value-link" @click="emitClickOnTransactions">
                    {{
                        transactionsCount === 1
                            ? $t('components.blockoverview.count_transaction')
                            : $t('components.blockoverview.count_transactions', { count: transactionsCount })
                    }}
                </span>
                {{ $t('components.blockoverview.in_this_block') }}
            </div>
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blockoverview.size_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blockoverview.size') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ size }}</div>
        </div>
    </div>
    <hr class="c-block-data__separator" >
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blockoverview.gas_used_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blockoverview.gas_used') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ gasUsed }}</div>
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blockoverview.gas_limit_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blockoverview.gas_limit') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ gasLimit }}</div>
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blockoverview.nonce_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blockoverview.nonce') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ nonce }}</div>
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blockoverview.hash_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blockoverview.hash') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value  c-block-data__row-value--hash">{{ hash }}</div>
        </div>
    </div>
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blockoverview.parent_hash_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blockoverview.parent_hash') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value c-block-data__row-value--hash">{{ parentHash }}</div>
        </div>
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
    &__row, &__col-att, &__col-val {
        display: flex;
        flex-direction: row;
        justify-content: left;
        align-items: baseline;
        gap: 5px;
    }
    &__row {
        padding: 0.5rem 0;
    }
    &__row-tooltip {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    &__row-attribute {
        font-weight: 500;
        max-width: 230px;
        min-width: 130px;
        width: 12vw;
        text-wrap: nowrap;
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
            display: flex;
            align-items: center;
            gap: 5px;
            flex-wrap: wrap;
        }
        &--hash {
            word-break: break-all;
        }
    }
    &__row-date-field {
        text-wrap: nowrap;
    }
    &__row-icon-btn {
        cursor: pointer;
        color: rgb(8, 29, 53);
        background-color: rgb(233, 236, 239);
        border: solid 1.25px rgb(233, 236, 239);
        height: 22px;
        width: 22px;
        border-radius: 6px;
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
    &__row-tooltip-icon {
        color: #999;
    }

    @media screen and (max-width: 900px) {
        &__row {
            flex-direction: column;
            align-items: flex-start;
        }
        &__row-attribute {
            min-width: 100%;
            margin-top: 5px;
        }
        &__row-value {
            margin-left: 0;
        }
    }
}
</style>

