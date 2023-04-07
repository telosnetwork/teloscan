<script>
import JsonViewer from 'vue-json-viewer';
import FragmentList from 'components/Transaction/FragmentList.vue';
import { WEI_PRECISION, formatWei, parseErrorMessage  } from 'src/lib/utils';
import { BigNumber } from 'ethers';

export default {
    name: 'InternalTxns',
    components: {
        JsonViewer,
        FragmentList,
    },
    props: {
        traces : {
            type: Object,
            required: false,
        },
        transaction : {
            type: Object,
            required: false,
            default: null,
        },
    },
    methods: {
        async getContract(address){
            try {
                return  await this.$contractManager.getContract(address);
            } catch (e) {
                console.error(`Failed to retrieve contract with address ${address}`);
                // Notify the user
                this.$q.notify({
                    message: this.$t('components.transaction.failed_to_retrieve_contract', { address }),
                    type: 'negative',
                    position: 'top',
                });
            }
        },
    },
    async created() {
        this.loading = true;
        try {
            let dataset;
            if(typeof this.traces !== 'undefined' && this.traces !== null) {
                dataset = this.traces;
            } else {
                if(this.transaction === null){
                    return;
                }
                let query = `/transaction/${this.transaction.hash}/internal?limit=250&sort=ASC&offset=0&includeAbi=1`;
                let response = await this.$indexerApi.get(query);
                if(response && response.data?.results?.length > 0) {
                    dataset = response.data?.results;
                    this.$contractManager.addContractsToCache(response.data?.contracts);
                } else {
                    console.error(`Could not retrieve internal transactions for transaction ${this.transaction.hash}`,
                        response,
                    );
                    return;
                }
            }
            for (let k = 0; k < dataset.length; k++) {
                dataset[k].action = JSON.parse(dataset[k].action);
            }
            for (let k = 0; k < dataset.length; k++) {
                let itx = dataset[k];

                // Get rid of duplicated calls
                if(k === 1){
                    if(itx.action.input === dataset[k - 1].action.input
                        && itx.action.from === dataset[k - 1].action.from
                        && itx.action.to === dataset[k - 1].action.to
                        && itx.action.value === dataset[k - 1].action.value
                    ){
                        continue;
                    }
                }

                itx.callType = itx.action.callType;
                let contract = await this.getContract(itx.action.to);
                let fnsig = (itx.action.input) ? itx.action.input.slice(0, 10) : '';
                let name = this.$t('components.transaction.unknown');
                let inputs, outputs, args = false;
                let isTransferETH = false;

                if (itx.type === 'create') {
                    name = this.$t('components.transaction.contract_deployment');
                } else if (fnsig && fnsig !== '0x') {
                    name = this.$t('components.transaction.unknown') + ' (' + fnsig + ')';
                } else if (
                    itx.action.value > 0
                ) {
                    name = this.$t('components.transaction.tlos_transfer');
                    isTransferETH = true;
                }
                if(itx.error !== null){
                    name = name + ' - ' + this.$t('global.error');
                }

                if (itx.action.input) {
                    const parsedTransaction = await this.$contractManager.parseContractTransaction(
                        itx,
                        itx.action.input,
                        contract,
                    );
                    if (parsedTransaction) {
                        args = parsedTransaction.args;
                        name = parsedTransaction.signature;
                        parsedTransaction.isTransferETH = false;
                        outputs = parsedTransaction.functionFragment ?
                            parsedTransaction.functionFragment.outputs :
                            parsedTransaction.outputs;

                        inputs = parsedTransaction.functionFragment ?
                            parsedTransaction.functionFragment.inputs :
                            parsedTransaction.inputs;
                    }
                }
                this.itxs.push(itx);
                this.parsedItxs.push({
                    index: itx.index,
                    type: itx.type,
                    args: args,
                    error: (itx.error !== null && itx.result?.output.slice(0, 10) === '0x08c379a0')
                        ? itx.error + ': ' + parseErrorMessage(itx.result?.output)
                        : itx.error,
                    traceAddress: itx.traceAddress,
                    parent: itx.traceAddress[0] || 0,
                    name: name,
                    from: itx.action?.from,
                    isTransferETH: isTransferETH,
                    sig: fnsig,
                    inputs: inputs,
                    outputs: outputs,
                    depth: itx.traceAddress.length,
                    to: itx.action?.to,
                    contract: contract,
                    value: (itx.type !== 'create' && (!fnsig || fnsig === '0x') && itx.action.value)
                        ? formatWei(itx.action.value, WEI_PRECISION)
                        : 0,
                });
            }
            this.parsedItxs.sort((a, b) => BigNumber.from(a.parent).sub(BigNumber.from(b.parent)).toNumber());
        } catch (e) {
            console.error(`Could not retrieve internal transactions for transaction: ${e}`);
        }
        this.loading = false;
    },
    data () {
        return {
            human_readable: true,
            parsedItxs: [],
            loading:  true,
            itxs: [],
        };
    },
};
</script>
<template>
<div>
    <div v-if="loading" class="row center justify-center items-center">
        <q-spinner size="md" />
    </div>
    <div v-else-if="itxs.length === 0" class="row">
        <div class="col-12 flex items-center justify-center">
            <q-icon class="fa fa-info-circle" size="md" />
            <h5 class="text-center  q-ma-md"> {{ $t('components.transaction.no_internal_trxs_found') }}</h5>
        </div>
    </div>
    <div v-else class="row">
        <div class="col-12 u-flex--center-y">
            <q-toggle
                v-model="human_readable"
                icon="visibility"
                color="secondary"
                size="lg"
            />
            {{ $t('components.transaction.human_readable') }}
            <small>
                <q-icon name="info" class="q-mb-xs q-ml-xs" size="14px"/>
                <q-tooltip>
                    {{ $t('components.transaction.verify_related_contract') }}
                </q-tooltip>
            </small>
        </div>
        <div class="col-12">
            <FragmentList
                v-if="human_readable"
                :fragments="itxs"
                :parsedFragments="parsedItxs"
            />
            <JsonViewer
                v-else
                :value="itxs"
                theme="custom-theme"
                class="q-mb-md"
            />
        </div>
    </div>
</div>
</template>
