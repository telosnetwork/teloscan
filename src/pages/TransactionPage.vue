<script>
import { mapGetters, mapActions } from 'vuex';
import DateField from 'components/DateField';
import BlockField from 'components/BlockField';
import AddressField from 'components/AddressField';
import LogsViewer from 'components/Transaction/LogsViewer';
import InternalTxns from 'components/Transaction/InternalTxns';
import CopyButton from 'components/CopyButton';
import MethodField from 'components/MethodField';
import ERCTransferList from 'components/Transaction/ERCTransferList';
import ApprovalList from 'components/Transaction/ApprovalList';
import ParameterList from 'components/Transaction/ParameterList';

import { BigNumber } from 'ethers';
import {
    WEI_PRECISION,
    REVERT_FUNCTION_SELECTOR,
    REVERT_PANIC_SELECTOR,
    formatWei,
    parseErrorMessage,
    getRouteWatcherForTabs,
} from 'src/lib/utils';

const REVERT_SELECTORS = [REVERT_FUNCTION_SELECTOR, REVERT_PANIC_SELECTOR];

const tabs = {
    general: '#general',
    details: '#details',
    eventLog: '#eventlog',
    internal: '#internal',
};

// TODO: The get_transactions API doesn't format the internal transactions properly,
//  need to fix that before we try to decode them
export default {
    name: 'TransactionPage',
    components: {
        LogsViewer,
        InternalTxns,
        AddressField,
        BlockField,
        CopyButton,
        DateField,
        MethodField,
        ERCTransferList,
        ApprovalList,
        ParameterList,
    },
    data() {
        return {
            hash: this.$route.params.hash,
            blockData: null,
            trxNotFound: false,
            errorMessage: null,
            trx: null,
            params: [],
            tab: '#general',
            isContract: false,
            contract: null,
            loading: true,
            parsedTransaction: null,
            methodTrx: null,
            showAge: true,
            showWei: false,
        };
    },
    computed: {
        ...mapGetters('chain', ['tlosPrice']),
    },
    watch: {
        '$route.params': {
            handler(newValue) {
                const { hash } = newValue;
                if (this.hash === hash) {
                    return;
                }

                this.resetTransaction();
                this.hash = hash;
                this.loadTransaction();
            },
            immediate: true,
        },
        $route: getRouteWatcherForTabs('transaction', tabs, tabs.general),
    },
    async mounted() {
        await this.loadTransaction();
    },
    async created() {
        await this.fetchTlosPrice();
    },
    methods: {
        ...mapActions('chain', ['fetchTlosPrice']),
        formatWei,
        resetTransaction() {
            this.blockData = null;
            this.trx = null;
            this.tab = '#general';
            this.isContract = false;
            this.contract = null;
            this.parsedTransaction = null;
            this.methodTrx = null;
            this.params = [];
        },
        async loadTransaction() {
            const trxResponse = await this.$indexerApi.get(
                `/transaction/${this.hash}?full=true&includeAbi=true`,
            );
            if (trxResponse.data.results.length === 0) {
                this.trxNotFound = true;
                return;
            }
            this.trx = trxResponse.data.results[0];
            if(this.trx.logs){
                this.trx.logs = this.trx.logs.replace('transaction_hash', 'transactionHash');
                this.trx.logs = JSON.parse(this.trx.logs);
            }
            this.trx.gasUsed = BigNumber.from(this.trx.gasUsed);
            this.trx.gasLimit = BigNumber.from(this.trx.gasLimit);
            this.trx.value = BigNumber.from(this.trx.value.toLocaleString('fullwide', { useGrouping:false }));
            await this.loadContract();
            this.setErrorMessage();
            this.loading = false;
        },
        async loadErrorMessage() {
            if(this.trx.output && REVERT_SELECTORS.includes(this.trx.output.slice(0, 10))){
                this.errorMessage = parseErrorMessage(this.trx.output);
                return;
            }
            const response = await this.$indexerApi.get(
                `/transaction/${this.hash}/internal`,
            );
            const intrxs = response.data.results;
            for(let i = 0; i < intrxs.length; i++){
                const intrx = intrxs[i];
                const output = (REVERT_SELECTORS.includes(intrx.result?.output.slice(0, 10)))
                    ? intrx.result?.output
                    : this.trx.output
                ;
                if(intrx.error !== null){
                    this.errorMessage = (REVERT_SELECTORS.includes(output?.slice(0, 10)))
                        ? parseErrorMessage(output)
                        : intrx.error
                    ;
                    return;
                }
            }
        },
        async loadContract() {
            if (!this.trx || this.trx.input === '0x') {
                return;
            }


            const contract = await this.$contractManager.getContract(this.trx.to?.toLowerCase());
            if (!contract) {
                return;
            }

            this.contract = contract;
            this.parsedTransaction = await this.$contractManager.parseContractTransaction(
                this.trx,
                this.trx.input,
                contract,
            );
            this.params = this.getFunctionParams();
            this.methodTrx = Object.assign(
                { parsedTransaction: this.parsedTransaction },
                this.trx,
            );
            this.isContract = true;
        },
        async setErrorMessage() {
            if (this.trx.status === '0x1') {
                return;
            }
            await this.loadErrorMessage();
        },
        getFunctionName() {
            if (this.parsedTransaction) {
                return this.parsedTransaction.name;
            }
        },
        getFunctionParams() {
            if (!this.parsedTransaction) {
                return [];
            }
            let args = [];
            this.parsedTransaction.functionFragment.inputs.forEach((input, i) => {
                args.push({
                    name: input.name,
                    type: input.type,
                    arrayChildren: (input.arrayChildren !== null) ? input.arrayChildren.type : false,
                    value:  this.parsedTransaction.args[i],
                });
            });
            return args;
        },
        getGasFee() {
            return formatWei(
                BigNumber.from(this.trx.gasPrice)
                    .mul(this.trx.gasUsed).toLocaleString('fullwide', { useGrouping:false }),
                WEI_PRECISION,
                5,
            );
        },
        getGasChargedGWEI() {
            return formatWei(this.trx.gasPrice, 9, 2);
        },
    },
};
</script>

<template>
<div class="pageContainer">
    <div class="row">
        <div class="col-12 q-px-md">
            <div class="text-h4 text-primary q-mb-lg title q-pt-xl">
                {{ $t('pages.transaction_details') }}
            </div>
            <div v-if="trxNotFound" class="text-h6 q-mb-lg text-white">
                {{ $t('pages.transaction_not_found', { hash }) }}
            </div>
        </div>
    </div>
    <div v-if="!trxNotFound" class="row tableWrapper">
        <div class="col-12 q-py-lg">
            <div v-if="loading" class="content-container q-pa-md text-center">
                <q-spinner size="lg" />
            </div>
            <div v-else-if="trx" :key="isContract" class="content-container">
                <q-tabs
                    v-model="tab"
                    class="text-white topRounded"
                    dense="dense"
                    active-color="secondary"
                    align="justify"
                    narrow-indicator="narrow-indicator"
                    :class="$q.dark.isActive ? 'q-dark' : 'q-light'"
                >
                    <q-route-tab
                        class="topLeftRounded"
                        name="general"
                        :to="{ hash: '#general' }"
                        exact="exact"
                        replace="replace"
                        :label="$t('pages.general')"
                    />
                    <q-route-tab
                        name="details"
                        :to="{ hash: '#details' }"
                        exact="exact"
                        replace="replace"
                        :label="$t('pages.details')"
                    />
                    <q-route-tab
                        name="logs"
                        :to="{ hash: '#eventlog' }"
                        exact="exact"
                        replace="replace"
                        :label="$t('pages.logs')"
                    />
                    <q-route-tab
                        class="topRightRounded"
                        name="internal"
                        :to="{ hash: '#internal' }"
                        exact="exact"
                        replace="replace"
                        :label="$t('pages.internal_txns')"
                    />
                </q-tabs>
                <q-tab-panels
                    v-model="tab"
                    class="column"
                    animated="animated"
                    keep-alive="keep-alive"
                >
                    <q-tab-panel v-if="trx !== null" id="transaction-page" name="general"><br><br>
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
                                    :highlight="trx.logs?.length > 1"
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
                    </q-tab-panel>
                    <q-tab-panel name="details">
                        <div>
                            <div class="col-3"><strong>{{ $t('pages.input') }}:&nbsp;</strong></div>
                            <div class="col-9">{{ trx.input }}</div>
                        </div><br>
                        <div>
                            <div class="col-3"><strong>{{ $t('pages.output') }}:&nbsp;</strong></div>
                            <div class="col-9">{{ trx.output }}</div>
                        </div>
                    </q-tab-panel>
                    <q-tab-panel name="logs">
                        <div class="jsonViewer">
                            <LogsViewer :logs="trx?.logs" :trx="trx" :contract="contract"/>
                        </div>
                    </q-tab-panel>
                    <q-tab-panel name="internal">
                        <InternalTxns :transaction="trx" />
                    </q-tab-panel>
                </q-tab-panels>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="sass">
@media screen and (max-width: 650px)
    #function-parameters
        width: 100%
        flex: auto
        margin-top: 20px

    #transaction-page
        .col-3
            width: 100%
        .col-9
            width: 100%

    @media only screen and (max-width: 900px)
        #function-parameters
            .row
                .col-4
                    width: 100%
                    padding-left: 15px
                .col-8
                    padding-bottom: 10px
                    padding-left: 30px
                    width: 100%
</style>

<style lang="sass" scoped>
.pageContainer
    flex: 0 1 1200px
    margin: auto
    max-width: 1200px

.tableContainer
    max-width: 100vw

.content-container
    background: $primary

span
    word-break: break-word

.col-9 .positive .q-icon, .col-9 .negative .q-icon
    margin-top: -5px
    margin-right: 5px

.date .col-9 > div
    display: inline-block

body.body--dark
    .content-container
        background: $dark
    .col-9 .positive
        background: $positive
        span, .q-icon
            color: white !important
    .col-9 .negative
        background: $negative
        span, .q-icon
            color: white !important

.col-9 .positive, .col-9 .negative
    border: 1px solid
    border-radius: 5px
    padding: 5px 10px

.col-9 .jv-container .jv-code
    padding: 0

.col-9
    word-break: break-word

.q-tabs__content
    margin-bottom: -1px

@media only screen and (max-width: 550px)
    .col-9 .positive .q-icon, .col-9 .negative .q-icon
        margin-top: 0px
    .q-tab
        padding: 0px 5px
    .q-tab__label
        font-size: 11px
</style>

