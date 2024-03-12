<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ethers } from 'ethers';

import { useRoute } from 'vue-router';
import { contractManager, indexerApi } from 'src/boot/telosApi';

import LogsViewer from 'components/Transaction/LogsViewer';
import InternalTxns from 'components/Transaction/InternalTxns';

const route = useRoute();

import {
    REVERT_FUNCTION_SELECTOR,
    REVERT_PANIC_SELECTOR,
    parseErrorMessage,
} from 'src/lib/utils';


import TransactionOverview from 'src/components/TransactionOverview.vue';
import { EvmContractFunctionParameter, EvmTransaction, EvmTransactionLog } from 'src/antelope/types';
import { EvmTransactionExtended } from 'src/types';

const { t: $t } = useI18n();

const REVERT_SELECTORS = [REVERT_FUNCTION_SELECTOR, REVERT_PANIC_SELECTOR];

const defaultTab = 'overview';
const tab = ref(defaultTab);
const trxNotFound = ref(false);
const hash = ref('');
const errorMessage = ref<string | undefined>(undefined);
const isContract = ref(false);
const trx = ref<EvmTransactionExtended | null>(null);

// functions
const loadTransaction = async () => {
    const trxResponse = await indexerApi.get(`/transaction/${hash.value}?full=true&includeAbi=true`);
    if (trxResponse.data.results.length === 0) {
        trxNotFound.value = true;
        return;
    }
    const aux = trxResponse.data.results[0] as EvmTransaction;
    let logsArray: EvmTransactionLog[] = [];
    if(aux.logs){
        const fixedStr = aux.logs.replace('transaction_hash', 'transactionHash');
        try {
            logsArray = JSON.parse(fixedStr) as EvmTransactionLog[];
        } catch (e) {
            console.error('Error parsing logs', e);
        }
    }
    const _trx:EvmTransactionExtended = {
        ...aux,
        gasUsedBn: ethers.BigNumber.from(aux.gasUsed),
        gasLimitBn: ethers.BigNumber.from(aux.gasLimit),
        valueBn: ethers.BigNumber.from(aux.value),
        gasPriceBn: ethers.BigNumber.from(aux.gasPrice),
        contract: undefined,
        parsedTransaction: undefined,
        functionParams: [],
        logsArray,
    };
    await loadContract(_trx);
    setErrorMessage();
};

const loadContract = async (_trx: EvmTransactionExtended) => {
    if (!_trx || _trx.input === '0x') {
        trx.value = _trx;
        return;
    }
    _trx.contract = await contractManager.getContract(_trx.to?.toLowerCase());
    if (!_trx.contract) {
        trx.value = _trx;
        return;
    }

    _trx.parsedTransaction = await contractManager.parseContractTransaction(
        _trx,
        _trx.input,
        _trx.contract,
    );

    _trx.functionParams = getFunctionParams();

    trx.value = _trx;
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
    if (!newValue || hash.value === newValue) {
        return;
    }
    hash.value = typeof newValue === 'string' ? newValue : newValue[0];
    loadTransaction();
}, { immediate: true });

</script>

<template>
<div class="c-trx-page">
    <div class="c-trx-page__header">
        <span class="c-trx-page__header-title">{{ $t('pages.transaction.page_title') }}</span>
        <span class="c-trx-page__header-block-num">#</span>
    </div>

    <q-tabs
        v-model="tab"
        class="c-trx-page__tabs-tabs"
    >
        <q-tab class="c-trx-page__tabs-tab" name="overview" :label="$t('pages.transaction.overview')" />
        <q-tab class="c-trx-page__tabs-tab" name="logs" :label="$t('pages.transaction.logs')" />
        <q-tab class="c-trx-page__tabs-tab" name="internal" :label="$t('pages.transaction.internal')" />
    </q-tabs>

    <div class="c-trx-page__main-container">
        <div class="c-trx-page__main-content">
            <q-tab-panels v-model="tab" class="c-trx-page__panels">
                <q-tab-panel class="c-trx-page__panel c-trx-page__panel--overview" name="overview">
                    <div class="c-trx-page__overview c-trx-page__panel-content">
                        <TransactionOverview
                            :trx="trx"
                        />
                    </div>
                </q-tab-panel>
                <q-tab-panel class="c-trx-page__panel c-trx-page__panel--logs" name="logs">
                    <q-card class="c-trx-page__logs c-trx-page__panel-content">
                        <LogsViewer
                            :trx="trx"
                            :contract="trx?.contract"
                            :logs="trx?.logsArray"
                        />
                    </q-card>
                </q-tab-panel>
                <q-tab-panel class="c-trx-page__panel c-trx-page__panel--internal" name="internal">
                    <q-card class="c-trx-page__internal c-trx-page__panel-content">
                        <InternalTxns
                            :transaction="trx"
                        />
                    </q-card>
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
    &__panel-content {
        min-height: 150px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
}
</style>
