<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ethers } from 'ethers';

import type { BlockData } from 'src/types';

import DateField from 'components/DateField.vue';

const locale = useI18n().locale.value;

const props = defineProps({
    data: {
        type: Object as () => BlockData | null,
        required: false,
    },
});

const emit = defineEmits(['prev-block', 'next-block', 'trx-table', 'extra-data']);

const blockNumber = ref(0);
const blockData = ref<BlockData | null>(null);

// Computed properties
const loading = computed(() => blockData.value === null);
const timestamp = computed(() => blockData.value ? blockData.value.timestamp : 0);
const transactionsCount = computed(() => blockData.value ? blockData.value.transactionsCount : 0);
const size = computed(() => {
    if (blockData.value) {
        const size = ethers.BigNumber.from(blockData.value.size).toNumber();
        return `${size.toLocaleString(locale)} bytes`;
    }
    return '0';
});
const gasUsed = computed(() => {
    if (blockData.value) {
        const gas = ethers.BigNumber.from(blockData.value.gasUsed);
        try {
            return gas.toNumber().toLocaleString(locale);
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
            return gas.toNumber().toLocaleString(locale);
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
const extraData = computed(() => blockData.value ? blockData.value.extraData : '');
const transactionsRoot = computed(() => blockData.value ? blockData.value.transactionsRoot : '');

// button Actions
const trxTableClick = () => {
    emit('trx-table');
};
const extraDataClick = () => {
    emit('extra-data', extraData.value.replace(/^0x/, ''));
};
const prevBlock = () => {
    emit('prev-block');
};
const nextBlock = () => {
    emit('next-block');
};

watch(() => props.data, (newData) => {
    blockData.value = newData ?? null;
    const newNumber = Number(newData?.number);
    if (!isNaN(newNumber)) {
        blockNumber.value = newNumber;
    }
}, { immediate: true });

</script>


<template>
<q-card class="c-block-data">

    <!-- Block Number -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.block_height_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.block_height') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ blockNumber }}</div>
            <div class="c-block-data__row-icon-btn c-block-data__row-icon-btn--left" @click="prevBlock">
                <i class="fa fa-chevron-left small"></i>
            </div>
            <div class="c-block-data__row-icon-btn c-block-data__row-icon-btn--right" @click="nextBlock">
                <i class="fa fa-chevron-right small"></i>
            </div>
        </div>
    </div>

    <!-- Timestamp -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.timestamp_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.timestamp') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div v-if="!loading" class="c-block-data__row-value c-block-data__row-value--timestamp">
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
                />)</span>
            </div>
        </div>
    </div>

    <!-- Transactions Count -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.transactions_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.transactions') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">
                <template
                    v-if="transactionsCount > 0"
                >
                    <span class="c-block-data__row-value-link" @click="trxTableClick">
                        {{
                            transactionsCount === 1
                                ? $t('components.blocks.count_transaction')
                                : $t('components.blocks.count_transactions', { count: transactionsCount })
                        }}
                    </span>
                </template>
                <template v-else>
                    {{ $t('components.blocks.count_transactions', { count: transactionsCount }) }}
                </template>
                {{ $t('components.blocks.in_this_block') }}
            </div>
        </div>
    </div>

    <!-- Size -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.size_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.size') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ size }}</div>
        </div>
    </div>

    <!-- Separator -->
    <hr class="c-block-data__separator" >

    <!-- Gas Used -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.gas_used_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.gas_used') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ gasUsed }}</div>
        </div>
    </div>

    <!-- Gas Limit -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.gas_limit_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.gas_limit') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ gasLimit }}</div>
        </div>
    </div>

    <!-- Extra Data -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.extra_data_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.extra_data') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div
                class="c-block-data__row-value c-block-data__row-value--hash c-block-data__row-value--pointer"
                @click="extraDataClick"
            >{{ extraData }}</div>
        </div>
    </div>

    <!-- Hash -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.hash_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.hash') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value  c-block-data__row-value--hash">{{ hash }}</div>
        </div>
    </div>

    <!-- Parent Hash -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.parent_hash_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.parent_hash') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div
                class="c-block-data__row-value c-block-data__row-value--hash c-block-data__row-value--pointer"
                @click="prevBlock"
            >{{ parentHash }}</div>
        </div>
    </div>

    <!-- Transactions Root -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.extra_data_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.extra_data') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value c-block-data__row-value--hash">{{ transactionsRoot }}</div>
        </div>
    </div>

    <!-- Nonce -->
    <div class="c-block-data__row">
        <div class="c-block-data__col-att">
            <div class="c-block-data__row-tooltip">
                <q-icon class="c-block-data__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.blocks.nonce_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-block-data__row-attribute">{{ $t('components.blocks.nonce') }}</div>
        </div>
        <div class="c-block-data__col-val">
            <div class="c-block-data__row-value">{{ nonce }}</div>
        </div>
    </div>
</q-card>

</template>


<style lang="scss">

.c-block-data {
    padding: 1.25rem!important;
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
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
        min-width: 200px;
        width: 15vw;
        text-wrap: nowrap;
    }
    &__row-value {
        margin-left: 1rem;
        &-link {
            cursor: pointer;
            color: var(--q-primary);
        }
        &--hardcoded {
            color: $grey;
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
        &--pointer {
            cursor: pointer;
            color: var(--q-primary);
        }
    }
    &__row-date-field {
        text-wrap: nowrap;
    }
    &__row-icon-btn {
        cursor: pointer;
        height: 22px;
        width: 22px;
        color: white;
        background-color: $grey;
        border: solid 1.25px $grey;
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
        .q-dark & {
            color: rgb(8, 29, 53);
        }
    }
    &__separator {
        border: 1px solid $grey;
        margin: 1rem 0;
    }
    &__row-tooltip-icon {
        color: $grey;
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

