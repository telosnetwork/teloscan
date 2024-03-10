<script lang="ts" setup>
import { ref, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ethers } from 'ethers';

import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { contractManager, indexerApi } from 'src/boot/telosApi';

import LogsViewer from 'components/Transaction/LogsViewer';
import InternalTxns from 'components/Transaction/InternalTxns';

const $q = useQuasar();
const route = useRoute();

import {
    WEI_PRECISION,
    REVERT_FUNCTION_SELECTOR,
    REVERT_PANIC_SELECTOR,
    formatWei,
    parseErrorMessage,
    getRouteWatcherForTabs,
} from 'src/lib/utils';

console.log([WEI_PRECISION, REVERT_FUNCTION_SELECTOR, REVERT_PANIC_SELECTOR, formatWei, parseErrorMessage, getRouteWatcherForTabs, $q]); // FIXME: remove this line

import TransactionOverview from 'src/components/TransactionOverview.vue';
import { EvmContractFunctionParameter, EvmTransaction } from 'src/antelope/types';
import { EvmTransactionExtended } from 'src/types';

const { t: $t } = useI18n();

/*
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
*/


const REVERT_SELECTORS = [REVERT_FUNCTION_SELECTOR, REVERT_PANIC_SELECTOR];

const defaultTab = 'overview';
const tab = ref(defaultTab);
const trxNotFound = ref(false);
const hash = ref('');
const errorMessage = ref<string | undefined>(undefined);
const loading = ref(false);
const isContract = ref(false);

const trx = ref<EvmTransactionExtended | null>(null);

// functions
const loadTransaction = async () => {
    console.log('loadTransaction()');
    loading.value = true;
    const trxResponse = await indexerApi.get(`/transaction/${hash.value}?full=true&includeAbi=true`);
    if (trxResponse.data.results.length === 0) {
        trxNotFound.value = true;
        loading.value = false;
        return;
    }
    const aux = trxResponse.data.results[0] as EvmTransaction;
    trx.value = {
        ...aux,
        gasUsedBn: ethers.BigNumber.from(aux.gasUsed),
        gasLimitBn: ethers.BigNumber.from(aux.gasLimit),
        valueBn: ethers.BigNumber.from(aux.value),
        gasPriceBn: ethers.BigNumber.from(aux.gasPrice),
        contract: undefined,
        parsedTransaction: undefined,
        functionParams: [],
    };
    await loadContract();
    setErrorMessage();
    loading.value = false;
};

const loadContract = async () => {
    console.log('loadContract()');
    const _trx = toRaw(trx.value) as EvmTransactionExtended;
    if (!_trx || _trx.input === '0x') {
        console.log('no contract');
        return;
    }
    _trx.contract = await contractManager.getContract(_trx.to?.toLowerCase());
    if (!_trx.contract) {
        return;
    }

    _trx.parsedTransaction = await contractManager.parseContractTransaction(
        _trx,
        _trx.input,
        _trx.contract,
    );

    _trx.functionParams = getFunctionParams();

    isContract.value = true;
};

const setErrorMessage = async () => {
    if (!trx.value || trx.value.status === '0x1') {
        return;
    }
    await loadErrorMessage();
};

const loadErrorMessage = async () => {
    if (!trx.value) {
        return;
    }
    if(trx.value.output && REVERT_SELECTORS.includes(trx.value.output.slice(0, 10))){
        errorMessage.value = parseErrorMessage(trx.value.output);
        return;
    }
    const response = await indexerApi.get(
        `/transaction/${hash.value}/internal`,
    );
    const intrxs = response.data.results;
    for(let i = 0; i < intrxs.length; i++){
        const intrx = intrxs[i];
        const output = (REVERT_SELECTORS.includes(intrx.result?.output.slice(0, 10)))
            ? intrx.result?.output
            : trx.value.output
        ;
        if(intrx.error !== null){
            errorMessage.value = (REVERT_SELECTORS.includes(output?.slice(0, 10)))
                ? parseErrorMessage(output)
                : intrx.error
            ;
            return;
        }
    }
};
const getFunctionParams = () => {
    if (!trx.value?.parsedTransaction) {
        return [];
    }
    const args:EvmContractFunctionParameter[] = [];
    trx.value?.parsedTransaction.functionFragment.inputs.forEach((input, i) => {
        args.push({
            name: input.name,
            type: input.type,
            arrayChildren: (input.arrayChildren !== null) ? input.arrayChildren.type : false,
            value:  trx.value?.parsedTransaction?.args[i],
        });
    });
    return args;
};



watch(() => route.params.hash, (newValue) => {
    if (hash.value === newValue) {
        return;
    }
    hash.value = typeof newValue === 'string' ? newValue : newValue[0];
    loadTransaction();
}, { immediate: true });



</script>

<template>
<div class="c-trx-page">
    <div class="c-trx-page__header">
        <span class="c-trx-page__header-title">{{ $t('pages.trxpage.block') }}</span>
        <span class="c-trx-page__header-block-num">#</span>
    </div>

    <q-tabs
        v-model="tab"
        class="c-trx-page__tabs-tabs"
    >
        <q-tab class="c-trx-page__tabs-tab" name="overview" :label="$t('pages.trxpage.overview')" />
        <q-tab class="c-trx-page__tabs-tab" name="logs" :label="$t('pages.trxpage.logs')" />
        <q-tab class="c-trx-page__tabs-tab" name="internal" :label="$t('pages.trxpage.internal')" />
    </q-tabs>

    <div class="c-trx-page__main-container">
        <div class="c-trx-page__main-content">
            <q-tab-panels v-model="tab" class="c-trx-page__panels">
                <q-tab-panel class="c-trx-page__panel c-trx-page__panel--overview" name="overview">
                    <div class="c-trx-page__overview">
                        <TransactionOverview
                            v-if="trx"
                            :trx="trx"
                        />
                    </div>
                </q-tab-panel>
                <q-tab-panel class="c-trx-page__panel c-trx-page__panel--logs" name="logs">
                    <div class="c-trx-page__logs">
                        <LogsViewer
                            :trx="trx"
                            :contract="trx?.contract"
                            :logs="trx?.logs"
                        />
                    </div>
                </q-tab-panel>
                <q-tab-panel class="c-trx-page__panel c-trx-page__panel--internal" name="internal">
                    <div class="c-trx-page__internal">
                        <InternalTxns
                            :trx="trx"
                        />
                    </div>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>

</div>
</template>

<style lang="scss">
.c-trx-page {
    --bs-gutter-x: 1.5rem;
    --bs-gutter-y: 0;
    padding-top: 35px;
    padding-right: calc(var(--bs-gutter-x) * .5);
    padding-left: calc(var(--bs-gutter-x) * .5);
    margin-right: auto;
    margin-left: auto;
    width: 100%;
    max-width: 1200px;
    &__header {
        display: flex;
        justify-content: left;
        gap: 10px;
        align-items: baseline;
        margin-bottom: 1.5rem;
        vertical-align: text-bottom;
        &-title {
            font-size: 1.4rem;
            font-weight: bold;
        }
    }

    &__tabs-tabs {
        display: inline-flex;
    }

    &__main-container {
        background: transparent !important;
    }
    &__main-content {
        padding: 0px;
    }
    &__panels {
        background: transparent;
    }
    &__panel {
        padding: 0px;
    }
}
</style>
