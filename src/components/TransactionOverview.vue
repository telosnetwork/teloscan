<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { computed, onMounted, ref, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockData, EvmTransactionExtended } from 'src/types';

import AddressField from 'components/AddressField.vue';
import BlockField from 'components/BlockField.vue';
import ValueField from 'components/ValueField.vue';
import DateField from 'components/DateField.vue';
import TransactionAction from 'components/TransactionAction.vue';
import GasLimitAndUsage from 'components/GasLimitAndUsage.vue';
import TransactionField from 'components/TransactionField.vue';
import TransactionFeeField from 'components/TransactionFeeField.vue';
import ERCTransferList from 'components/Transaction/ERCTransferList.vue';
import TLOSTransferList from 'components/Transaction/TLOSTransferList.vue';
import { useChainStore } from 'src/core';
import TransactionInputViewer from 'components/Transaction/TransactionInputViewer.vue';
import { DecodedTransactionInput, getParsedInternalTransactions } from 'src/lib/transaction-utils';

const { t: $t } = useI18n();

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
const toAddress = ref('');
const decodedData = ref<DecodedTransactionInput | null>(null);
const isAContractDeployment = ref(false);

const showMoreDetails = ref(true);
const showErc20Transfers = ref(true);
const showTLOSTransfers = ref(true);
const moreDetailsHeight = ref<string | number>(0);

const loadBlockData = async () => {
    const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
    try {
        if (blockNumber.value) {
            const response = await indexerApi.get(`/v1/block/${blockNumber.value}`);
            blockData.value = response.data?.results?.[0] as BlockData;
        }
    } catch (error) {
        console.error('Failed to fetch block data:', error);
        blockData.value = null;
    }
};

function setERC20TransfersCount(count: number) {
    showErc20Transfers.value = count > 0;
}

function setTLOSTransfersCount(count: number) {
    showTLOSTransfers.value = count > 0;
}

async function loadParsedInternalTransactions() {
    if (hash.value) {
        const { parsedItxs } = await getParsedInternalTransactions(hash.value, $t);
        const decoded = (toRaw(parsedItxs)[0] as {decoded:unknown})?.decoded;
        decodedData.value = decoded as DecodedTransactionInput;
    }
}

watch(() => props.trx, async (newTrx) => {
    if (newTrx) {
        if (newTrx.to) {
            toAddress.value = newTrx.to;
        } else {
            if (newTrx.contractAddress) {
                toAddress.value = newTrx.contractAddress;
                isAContractDeployment.value = true;
            }
        }
        await loadBlockData();
        await loadParsedInternalTransactions();
    }
}, { immediate: true });

const updateMoreDetailsHeight = () => {
    setTimeout(() => {
        const moreDetailsContainer = document.querySelector('.c-trx-overview__more-details-container') as HTMLDivElement;
        if (moreDetailsContainer) {
            const clone = completeClonehtmlElement(moreDetailsContainer);
            document.body.appendChild(clone);
            moreDetailsHeight.value = clone.scrollHeight;
            document.body.removeChild(clone);
            if (showMoreDetails.value) {
                moreDetailsContainer.style.setProperty('height', `${moreDetailsHeight.value}px`);
            } else {
                moreDetailsContainer.style.setProperty('height', '0px');
            }
        } else {
            setTimeout(updateMoreDetailsHeight, 100);
        }
    }, 20);
};

const completeClonehtmlElement = (element: HTMLElement) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.setProperty('position', 'absolute');
    clone.style.setProperty('visibility', 'hidden');
    clone.style.setProperty('height', 'auto');
    clone.style.setProperty('width', `${element.offsetWidth}px`);
    return clone;
};

watch(() => showMoreDetails.value, () => {
    updateMoreDetailsHeight();
});

watch(() => decodedData.value, () => {
    showMoreDetails.value = false;
    updateMoreDetailsHeight();
});

onMounted(() => {
    showMoreDetails.value = false;
    updateMoreDetailsHeight();
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
                <BlockField v-else :block="blockNumber ?? 0" />
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
            <template v-else>
                <TransactionAction
                    :trx="trx"
                />
            </template>
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
            />
        </div>
    </div>

    <!-- to -->
    <div v-if="toAddress" class="c-trx-overview__row" >
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
            <template v-if="isAContractDeployment">
                [
                <AddressField
                    :key="'trx-to-'+ toAddress"
                    copy
                    :address="toAddress"
                    :is-contract-trx="true"
                />
                Created ]
            </template>
            <template v-else>
                <AddressField
                    :key="'trx-to-'+ toAddress"
                    copy
                    :address="toAddress"
                    :is-contract-trx="!!trx?.contract"
                />
            </template>
        </div>
    </div>

    <!-- ERC20 Token Tranfers -->
    <div
        :class="{
            'c-trx-overview__row': true,
            'c-trx-overview__row--hidden': !showErc20Transfers,
        }"
    >
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
                @transfers-count="setERC20TransfersCount"
            />
        </div>
    </div>

    <!-- TLOS Tranfers -->
    <div
        :class="{
            'c-trx-overview__row': true,
            'c-trx-overview__row--hidden': !showTLOSTransfers,
        }"
    >
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon info-icon" name="fas fa-info-circle">
                    <q-tooltip anchor="bottom right" self="top start">
                        {{ $t('components.transaction.tlos_transfers_tooltip', {
                            symbol: useChainStore().currentChain.settings.getSystemToken().symbol,
                        }) }}
                    </q-tooltip>
                </q-icon>
            </div>
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.tlos_transfers', {
                symbol: useChainStore().currentChain.settings.getSystemToken().symbol,
            }) }}</div>
        </div>
        <div class="c-trx-overview__col-val c-trx-overview__col-val--erc-transfers">
            <TLOSTransferList
                v-if="trx"
                :transaction="trx"
                @transfers-count="setTLOSTransfersCount"
            />
            <q-skeleton v-else type="text" class="c-trx-overview__skeleton" />
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
                <ValueField
                    :value="trx.value"
                    :symbol="useChainStore().currentChain.settings.getSystemToken().symbol"
                    :decimals="useChainStore().currentChain.settings.getSystemToken().decimals"
                />
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
                <div v-else class="c-trx-overview__row-value c-trx-overview__row-value--input">
                    <TransactionInputViewer
                        :data="decodedData"
                        :input="props.trx?.input || '0x'"
                        @change="updateMoreDetailsHeight"
                    />
                </div>
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
        overflow: hidden;
    }
    &__row {
        padding: 0.5rem 0;
        &--toggle-details {
            cursor: pointer;
        }
        &--hidden {
            display: none;
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
