<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber } from 'ethers';
import { BlockData, EvmTransactionExtended } from 'src/types';
import { WEI_PRECISION } from 'src/lib/utils';
import { indexerApi } from 'src/boot/telosApi';
import { prettyPrintCurrency } from 'src/antelope/wallets/utils/currency-utils';

import AddressField from 'components/AddressField.vue';
import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import MethodField from 'components/MethodField.vue';
import GasLimitAndUsage from 'components/GasLimitAndUsage.vue';
import TransactionField from 'components/TransactionField.vue';
import TransactionFeeField from 'components/TransactionFeeField.vue';
import ERCTransferList from 'components/Transaction/ERCTransferList.vue';

const { t: $t } = useI18n();

const locale = useI18n().locale.value;

const props = defineProps<{
    trx: EvmTransactionExtended | null,
}>();

// attribute values
const loading = computed(() => !props.trx);
const hash = computed(() => props.trx?.hash);
const statusOk = computed(() => props.trx?.status === '0x1');
const blockNumber = computed(() => props.trx?.blockNumber);
const timestamp = computed(() => props.trx?.timestamp || 0);
const blockData = ref<BlockData | null>(null);
const transactionIndex = ref<number>(-1);
const highlightAddress = ref('');

const showMoreDetails = ref(true);
const moreDetailsHeight = ref(0);

const getValueDisplay = (value: string) =>
    prettyPrintCurrency(
        BigNumber.from(value),
        4,
        locale,
        false,
        'TLOS',
        false,
        WEI_PRECISION,
        false,
    );


const loadBlockData = async () => {
    try {
        if (blockNumber.value) {
            const response = await indexerApi.get(`/block/${blockNumber.value}`);
            blockData.value = response.data?.results?.[0] as BlockData;
            // workaround to avoid using number as property name
            blockData.value.blockNumber = blockData.value.blockNumber ?? +(blockData.value.number);
        }
    } catch (error) {
        console.error('Failed to fetch block data:', error);
        blockData.value = null;
    }
};

function setHighlightAddress(val: string) {
    highlightAddress.value = val;
}


watch(() => props.trx, async (newTrx) => {
    if (newTrx) {
        await loadBlockData();
    }
}, { immediate: true });

watch(() => blockData.value, (newBlockData) => {
    if (newBlockData) {
        const moreDetailsContainer = document.querySelector('.c-trx-overview__more-details-container');
        if (moreDetailsContainer) {
            moreDetailsHeight.value = moreDetailsContainer.clientHeight;
            showMoreDetails.value = false;
        }
    }
});

watch(() => showMoreDetails.value, (newShowMoreDetails) => {
    const moreDetailsContainer = document.querySelector('.c-trx-overview__more-details-container') as HTMLDivElement;
    if (moreDetailsContainer) {
        moreDetailsContainer.style.setProperty('height', newShowMoreDetails ? `${moreDetailsHeight.value}px` : '0px');
    }
});


</script>


<template>

<q-card class="c-trx-overview__card-section">
    <!-- Hash -->
    <div class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.trx_hash_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.trx_hash') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <div class="c-trx-overview__row-value  c-trx-overview__row-value--hash">
                <q-skeleton v-if="!hash" type="text" class="c-trx-overview__skeleton" />
                <TransactionField
                    v-else
                    color="primary"
                    :transaction-hash="hash"
                    :truncate="200"
                />
            </div>
        </div>
    </div>

    <!-- status -->
    <div class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.status_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.status') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <div class="c-trx-overview__row-value  c-trx-overview__row-value--status">
                <q-skeleton v-if="loading" type="text" class="c-trx-overview__skeleton" />
                <span v-else-if="statusOk" class="u-flex--center-y">
                    <q-icon name="check" color="positive" class="q-mr-xs"/>
                    <span class="c-trx-overview__status-value text-positive">{{ $t('pages.success') }}</span>
                </span>
                <span v-else class="u-flex--center-y">
                    <q-icon name="warning" color="negative" class="q-mr-xs"/>
                    <span class="c-trx-overview__status-value text-negative">{{ $t('pages.failure') }}</span>
                </span>
            </div>
        </div>
    </div>

    <!-- block -->
    <div class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.block_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.block') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <div class="c-trx-overview__row-value">
                <q-skeleton v-if="loading" type="text" class="c-trx-overview__skeleton" />
                <BlockField v-else :block="blockNumber" />
            </div>
        </div>
    </div>

    <!-- Timestamp -->
    <div class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.timestamp_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.timestamp') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <q-skeleton v-if="loading" type="text" class="c-trx-overview__skeleton" />
            <div v-if="!loading" class="c-trx-overview__row-value c-trx-overview__row-value--timestamp">
                <q-icon class="c-trx-overview__row-value-clock-icon" name="far fa-clock" />
                <span class="c-trx-overview__row-date-field"><DateField
                    class="c-trx-overview__row-value-clock-ago"
                    :epoch="Math.round(timestamp / 1000)"
                    :force-show-age="true"
                /></span>
                <span class="c-trx-overview__row-date-field">(<DateField
                    class="c-trx-overview__row-value-clock-time"
                    :epoch="Math.round(timestamp / 1000)"
                    :force-show-age="false"
                />)</span>
            </div>
        </div>
    </div>

    <!-- transaction action -->
    <div class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.trx_action_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.trx_action') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <q-skeleton v-if="!trx" type="text" class="c-trx-overview__skeleton" />
            <MethodField
                v-else
                :trx="trx"
                :fullText="true"
            />
        </div>
    </div>

    <!-- from -->
    <div class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.from_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.from') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <q-skeleton v-if="loading" type="text" class="c-trx-overview__skeleton" />
            <AddressField
                v-if="trx?.from"
                :key="'trx-from-'+ trx.from"
                copy
                :address="trx.from"
                :highlightAddress="highlightAddress"
                @highlight="setHighlightAddress"
            />
        </div>
    </div>

    <!-- to -->
    <div v-if="trx?.to" class="c-trx-overview__row" >
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.to_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.to') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <AddressField
                :key="'trx-to-'+ trx.to"
                copy
                :address="trx.to"
                :is-contract-trx="!!trx.contract"
                :highlightAddress="highlightAddress"
                @highlight="setHighlightAddress"
            />
        </div>
    </div>

    <!-- ERC20 Token Tranfers -->
    <div v-if="trx?.logsArray.length > 0" class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.erc20_transfers_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.erc20_transfers') }}</div>
        </div>
        <div class="c-trx-overview__col-val c-trx-overview__col-val--erc-transfers">
            <ERCTransferList
                :logs="trx?.logsArray ?? []"
                :type="'erc20'"
                :highlightAddress="highlightAddress"
                @highlight="setHighlightAddress"
            />
        </div>
    </div>

    <!-- value -->
    <div class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.value_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.value') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <q-skeleton v-if="!trx" type="text" class="c-trx-overview__skeleton" />
            <template v-else>
                {{ getValueDisplay(trx.value) }}
            </template>
        </div>
    </div>

    <!-- transaction fee -->
    <div class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.gas_fee_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.gas_fee') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <q-skeleton v-if="!trx" type="text" class="c-trx-overview__skeleton" />
            <TransactionFeeField
                v-else
                :showTotalGasFee="true"
                :gasUsed="trx.gasUsed"
                :gasPrice="trx.gasPrice"
            />
        </div>
    </div>

    <!-- gas price -->
    <div class="c-trx-overview__row">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.gas_price_tooltip') }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.gas_price') }}</div>
        </div>
        <div class="c-trx-overview__col-val">
            <q-skeleton v-if="!trx" type="text" class="c-trx-overview__skeleton" />
            <TransactionFeeField
                v-else
                :showTotalGasFee="false"
                :gasUsed="trx.gasUsed"
                :gasPrice="trx.gasPrice"
            />
        </div>
    </div>

</q-card>

<q-card v-if="trx" class="c-trx-overview__card-section">
    <div
        :class="{
            'c-trx-overview__more-details-container': true,
            'c-trx-overview__more-details-container--transparent': moreDetailsHeight === 0,
        }"
    >
        <!-- gas limit -->
        <div class="c-trx-overview__row">
            <div class="c-trx-overview__col-att">
                <div class="c-trx-overview__row-tooltip">
                    <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                        <q-tooltip anchor="bottom right" self="top start">
                            {{ $t('components.transaction.gas_limit_n_usage_tooltip') }}
                        </q-tooltip>
                    </q-icon>
                </div>
                <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.gas_limit_n_usage') }}</div>
            </div>
            <div class="c-trx-overview__col-val">
                <q-skeleton v-if="!blockData" type="text" class="c-trx-overview__skeleton" />
                <GasLimitAndUsage
                    v-if="blockData"
                    :trx="trx"
                    :block="blockData"
                />
            </div>
        </div>

        <!-- nonce -->
        <div class="c-trx-overview__row">
            <div class="c-trx-overview__col-att">
                <div class="c-trx-overview__row-tooltip">
                    <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                        <q-tooltip anchor="bottom right" self="top start">
                            {{ $t('components.transaction.nonce_tooltip') }}
                        </q-tooltip>
                    </q-icon>
                </div>
                <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.nonce') }}</div>
            </div>
            <div class="c-trx-overview__col-val">
                <q-skeleton v-if="loading" type="text" class="c-trx-overview__skeleton" />
                <div v-else>{{ trx.nonce }}</div>
            </div>
        </div>

        <!-- position in block -->
        <div v-if="transactionIndex >= 0" class="c-trx-overview__row">
            <div class="c-trx-overview__col-att">
                <div class="c-trx-overview__row-tooltip">
                    <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                        <q-tooltip anchor="bottom right" self="top start">
                            {{ $t('components.transaction.position_in_block_tooltip') }}
                        </q-tooltip>
                    </q-icon>
                </div>
                <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.position_in_block') }}</div>
            </div>
            <div class="c-trx-overview__col-val">
                {{ transactionIndex }}
            </div>
        </div>

        <!-- input -->
        <div class="c-trx-overview__row">
            <div class="c-trx-overview__col-att">
                <div class="c-trx-overview__row-tooltip">
                    <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                        <q-tooltip anchor="bottom right" self="top start">
                            {{ $t('components.transaction.input_tooltip') }}
                        </q-tooltip>
                    </q-icon>
                </div>
                <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.input') }}</div>
            </div>
            <div class="c-trx-overview__col-val">
                <q-skeleton v-if="loading" type="text" class="c-trx-overview__skeleton" />
                <div v-else class="c-trx-overview__row-value c-trx-overview__row-value--input">{{ trx.input }}</div>
            </div>
        </div>

    </div>
    <div class="c-trx-overview__row c-trx-overview__row--toggle-details" @click="showMoreDetails = !showMoreDetails">
        <div class="c-trx-overview__col-att c-trx-overview__col-att--toggle-details">
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.more_details') }}</div>
        </div>
        <div class="c-trx-overview__col-val c-trx-overview__col-val--toggle-details">
            <template v-if="showMoreDetails">
                <i class="fas fa-minus"></i>
                <span>{{ $t('components.transaction.show_less_details') }}</span>
            </template>
            <template v-else>
                <i class="fas fa-plus"></i>
                <span>{{ $t('components.transaction.show_more_details') }}</span>
            </template>
        </div>
    </div>
</q-card>
</template>

<style lang="scss">
.c-trx-overview {
    $grey: #909090;
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
    &__col-val {
        flex-grow: 1;
    }
    &__row {
        padding: 0.5rem 0;
        &--toggle-details {
            cursor: pointer;
        }
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
        width: 100%;
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
        &--input {
            word-break: break-word;
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
            align-items: stretch;
            &--toggle-details {
                flex-direction: row;
                justify-content: space-between;
            }
        }
        &__row-attribute {
            min-width: 100%;
            margin-top: 5px;
        }
        &__row-value {
            margin-left: 0;
        }
        &__col-att--toggle-details {
            flex-grow: unset;
        }
        &__col-val--toggle-details {
            flex-grow: unset;
        }
    }

    &__col-val--toggle-details {
        cursor: pointer;
        color: var(--q-primary);
        display: flex;
        align-items: center;
        gap: 5px;
        padding-left: 18px;
    }

    &__more-details-container {
        transition: height 0.3s ease-in-out;
        overflow: hidden;
        &--transparent {
            // this avoids the container from being visible while we capture its height
            opacity: 0;
            position: absolute;
        }
    }

    &__skeleton {
        height: 2rem;
        width: 100%;
    }
}
</style>
