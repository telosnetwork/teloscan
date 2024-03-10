<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EvmTransactionExtended } from 'src/types';


import AddressField from 'components/AddressField.vue';
import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import MethodField from 'components/MethodField.vue';
import TransactionDialog from 'components/TransactionDialog.vue';
import TokenValueField from 'components/Token/TokenValueField.vue';
import TransactionField from 'components/TransactionField.vue';
import TransactionFeeField from 'components/TransactionFeeField.vue';
import TransactionOverview from 'components/TransactionOverview.vue';
import { prettyPrintCurrency } from 'src/antelope/wallets/utils/currency-utils';
import { BigNumber } from 'ethers';
import { WEI_PRECISION } from 'src/lib/utils';

console.log([AddressField, BlockField, DateField, MethodField, TransactionDialog, TokenValueField, TransactionField, TransactionFeeField, TransactionOverview]); // FIXME: remove this line

const locale = useI18n().locale.value;

const props = defineProps<{
    trx: EvmTransactionExtended | null,
}>();
/*
export interface EvmTransaction {
    blockNumber: number;
    contractAddress?: string;
    cumulativeGasUsed: string; // string representation of hex number
    from: string;
    gasLimit: string; // string representation of hex number
    gasPrice: string; // string representation of hex number
    gasUsed: string; // string representation of hex number
    hash: string;
    index: number;
    input: string;
    nonce: number;
    output: string;
    logs?: string;
    r: string;
    s: string;
    status: string; // string representation of hex number
    timestamp: number; // epoch in milliseconds
    to: string;
    v: string;
    value: string; // string representation of hex number
}

export interface EvmTransactionParsed extends EvmTransaction {
    gasLimitBn: ethers.BigNumber;
    gasPriceBn: ethers.BigNumber;
    gasUsedBn: ethers.BigNumber;
    valueBn: ethers.BigNumber;
}

export interface EvmTransactionExtended extends EvmTransactionParsed {
    contract: Contract | null;
    parsedTransaction: TransactionDescription | null;
    functionParams: EvmContractFunctionParameter[];
}
*/

const emit = defineEmits(['prev-trx', 'next-trx']);
console.log([emit, props, locale, ref]); // FIXME: remove this line

// attribute values
const loading = computed(() => !props.trx);
const hash = computed(() => props.trx?.hash);
const statusOk = computed(() => props.trx?.status === '0x1');
const block = computed(() => props.trx?.blockNumber);
const timestamp = computed(() => props.trx?.timestamp || 0);

const showMoreDetails = ref(false);

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


</script>


<template>
<q-card class="c-trx-overview__card-section">
    <template v-if="trx">
        <!--
            <div class="fit row wrap justify-start items-start content-start">
                <div class="col-3">
                    <strong class="wrapStrong">{{ $t('pages.transaction_hash') }}:&nbsp;</strong>
                </div>
                <div class="col-9">
                    <span>{{ hash }}</span>
                    <CopyButton :text="hash"/>
                </div>
            </div><br>
            <div class="fit row wrap justify-start items-start content-start">
                <div class="col-3">
                    <strong>{{ $t('pages.block_number') }}:&nbsp;</strong>
                </div>
                <div class="col-9">
                    <BlockField :block="trx.blockNumber"/>
                </div>
            </div><br>
            <div
                class="fit row wrap justify-start items-start content-start date"
                @click="showAge = !showAge"
            >
                <div class="col-3">
                    <strong>{{ $t('pages.date') }}:&nbsp;</strong>
                </div>
                <div class="u-flex--left">
                    <DateField :epoch="trx.timestamp  / 1000"/>
                </div>
            </div><br>
            <div class="fit row wrap justify-start items-start content-start">
                <div class="col-3">
                    <strong>{{ $t('pages.status') }}:&nbsp;</strong>
                </div>
                <div class="col-9 q-py-xs">
                    <span v-if="trx.status == 1" class="positive">
                        <q-icon name="check"/>
                        <span>{{ $t('pages.success') }}</span>
                    </span>
                    <span v-else class="negative">
                        <q-icon name="warning"/><span>{{ $t('pages.failure') }}</span>
                    </span>
                </div>
            </div><br>
            <div v-if="errorMessage" class="fit row wrap justify-start items-start content-start">
                <div class="col-3">
                    <strong>{{ $t('pages.error_message') }}:&nbsp;</strong>
                </div>
                <div class="col-9">
                    <span class="text-negative">{{ errorMessage }}</span>
                </div>
            </div><br v-if="errorMessage">
            <div class="fit row wrap justify-start items-start content-start">
                <div class="col-3">
                    <strong>{{ $t('pages.from') }}:&nbsp;</strong>
                </div>
                <div class="col-9 word-break">
                    <AddressField
                        :address="trx.from"
                        :truncate="0"
                        copy="copy"
                    />
                </div>
            </div><br>
            <div v-if="trx.to" class="fit row wrap justify-start items-start content-start">
                <div class="col-3">
                    <strong>{{ $t('pages.to') }}:&nbsp;</strong>
                </div>
                <div class="col-9 word-break">
                    <AddressField
                        :address="trx.to"
                        :is-contract-trx="!!contract"
                        :truncate="0"
                        copy="copy"
                    />
                </div>
            </div>
            <div v-else-if="trx.contractAddress" class="fit row justify-start items-start content-start">
                <div class="col-3">
                    <strong>{{ $t('pages.deployed_contract') }}:&nbsp;</strong>
                </div>
                <div class="col-9 word-break">
                    <AddressField :address="trx.contractAddress" :truncate="0" copy="copy" />
                </div>
            </div><br>
            <div v-if="isContract" class="fit row wrap justify-start items-start content-start">
                <div class="col-3">
                    <strong>{{ $t('pages.contract_function') }}:&nbsp;</strong>
                </div>
                <div class="col-9">
                    <MethodField :contract="contract" :trx="methodTrx" :shortenSignature="true"/>
                </div>
            </div>
            <br v-if="isContract">
            <div
                v-if="isContract && params.length > 0"
                class="fit row wrap justify-start items-start content-start"
            >
                <div class="col-3"><strong>{{ $t('pages.function_parameters') }}:&nbsp;</strong></div>
                <div id="function-parameters" class="col">
                    <ParameterList :params="params" :contract="contract" :trxFrom="trx.from"/>
                </div>
            </div><br v-if="isContract && params.length > 0">
            <div v-if="trx.createdaddr" class="fit row wrap justify-start items-start content-start">
                <div class="col-3"><strong>{{ $t('pages.deployed_contract') }}:&nbsp;</strong></div>
                <div class="col-9 word-break">
                    <AddressField :address="trx.createdaddr"/>
                </div>
            </div><br v-if="trx.createdaddr">
            <div class="fit row wrap justify-start items-start content-start">
                <div class="col-3"><strong>{{ $t('pages.value') }}:&nbsp;</strong></div>
                <div class="col-9 clickable" @click="showWei = !showWei">
                    <div v-if="showWei">
                        <span>{{ trx.value }}</span>
                    </div>
                    <span v-else>
                        <span>{{ $t('pages.balance_tlos', { amount: formatWei(trx.value, 18) }) }}</span>
                        <q-tooltip>{{ $t('pages.click_to_show_in_wei') }}</q-tooltip>
                    </span>
                </div>
            </div>
            <br>
            <div v-if="trx.logs?.length > 0">
                <ApprovalList :trxFrom="trx.from" :logs="trx.logs" />
                <ERCTransferList :trxFrom="trx.from" type="erc20" :logs="trx.logs" />
                <ERCTransferList :trxFrom="trx.from" type="erc721" :logs="trx.logs" />
                <ERCTransferList :trxFrom="trx.from" type="erc1155" :logs="trx.logs" />
            </div>
            <div class="fit row wrap justify-start items-start content-start q-border-top">
                <div class="col-3">
                    <strong>{{ $t('pages.gas_price_charged') }}:&nbsp;</strong>
                </div>
                <span>{{ $t('pages.balance_gwei', { amount: getGasChargedGWEI() }) }}</span>
            </div>
            <br>
            <div class="fit row wrap justify-start items-start content-start">
                <div class="col-3">
                    <strong>{{ $t('pages.gas_fee') }}:&nbsp;</strong>
                </div>
                <span>
                    {{ $t('pages.balance_tlos', { amount: getGasFee() }) }}
                    <small class="q-pl-sm">(~ ${{ (getGasFee() * tlosPrice).toFixed(5) }})</small>
                </span>
            </div>
            <br>
            <div class="fit row wrap justify-start items-start content-start">
                <div class="col-3"><strong>{{ $t('pages.gas_used') }}:&nbsp;</strong></div>
                <div class="col-9">{{ trx.gasUsed }}</div>
            </div>
            <br>
            <div class="fit row wrap justify-start items-start content-start">
                <div class="col-3"><strong>{{ $t('pages.gas_limit') }}:&nbsp;</strong></div>
                <div class="col-9">{{ trx.gasLimit }}</div>
            </div>
            <br>
            <div class="fit row wrap justify-start items-start content-start">
                <div class="col-3"><strong>{{ $t('pages.nonce') }}:&nbsp;</strong></div>
                <div class="col-9">{{ trx.nonce }}</div>
            </div>
        -->

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
                <div class="c-trx-overview__row-value  c-trx-overview__row-value--hash">{{ hash }}</div>
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
                    <span v-if="statusOk" class="u-flex--center-y">
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
                <div class="c-trx-overview__row-value">{{ block }}</div>
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
                <MethodField
                    :trx="trx"
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
                <AddressField
                    v-if="trx.from"
                    :key="'trx-from-'+ trx.from"
                    :address="trx.from"
                    :copy="true"
                />
            </div>
        </div>

        <!-- to -->
        <div v-if="trx.to" class="c-trx-overview__row" >
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
                    :address="trx.to"
                    :is-contract-trx="!!trx.contract"
                    :copy="true"
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
                {{ getValueDisplay(trx.value) }}
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
                <TransactionFeeField
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
                <TransactionFeeField
                    :showTotalGasFee="false"
                    :gasUsed="trx.gasUsed"
                    :gasPrice="trx.gasPrice"
                />
            </div>
        </div>

        <!-- --- -->
        <!-- gas limit (& usage) -->
        <!-- nonce -->
        <!-- position in block -->
        <!-- input -->
    </template>
    <template v-else>
        <q-card-section class="q-pa-md">
            <q-spinner-gears color="primary" size="50px"/>
        </q-card-section>
    </template>
</q-card>
<q-card v-if="trx" class="c-trx-overview__card-section">
    <div
        :class="{
            'c-trx-overview__more-details-container': true,
            'c-trx-overview__more-details-container--show': showMoreDetails,
        }"
    >
        <h1>More details</h1>
    </div>
    <div class="c-trx-overview__row c-trx-overview__row--toggle-details" @click="showMoreDetails = !showMoreDetails">
        <div class="c-trx-overview__col-att">
            <div class="c-trx-overview__row-attribute">{{ $t('components.transaction.more_details') }}</div>
        </div>
        <div class="c-trx-overview__col-val c-trx-overview__col-val--toggle-details">
            <!--div class="c-trx-overview__row-tooltip">
                <q-icon class="c-trx-overview__row-tooltip-icon c-trx-overview__row-tooltip-icon--toggle-details info-icon" name="fas fa-info-circle" />
            </div-->
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
        min-width: 160px;
        width: 15vw;
        text-wrap: nowrap;
    }
    &__row-value {
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

    &__col-val--toggle-details {
        cursor: pointer;
        color: var(--q-primary);
        display: flex;
        align-items: center;
        gap: 5px;
        padding-left: 18px;
    }

    &__more-details-container {
        display: none;
        &--show {
            display: block;
        }
    }
}
</style>
