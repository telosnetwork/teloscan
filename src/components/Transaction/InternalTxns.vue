<script>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import FragmentList from 'components/Transaction/FragmentList.vue';
import { WEI_PRECISION, formatWei, parseErrorMessage  } from 'src/lib/utils';

export default {
    name: 'InternalTxns',
    components: {
        VueJsonPretty,
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
                if(this.transaction === null || this.itxs.length > 0){
                    return;
                }
                let query = `/transaction/${this.transaction.hash}/internal?limit=1000&sort=ASC&offset=0&includeAbi=1`;
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
                let inputs, outputs, args, name, isTransferETH = false;

                if (itx.type === 'create') {
                    name = this.$t('components.transaction.contract_deployment');
                } else if (itx.action.value > 0) {
                    name = this.$t('components.transaction.tlos_transfer');
                    isTransferETH = true;
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
                        isTransferETH = false;
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
                    sig: (itx.action.input) ? itx.action.input.slice(0, 10) : '',
                    inputs: inputs,
                    outputs: outputs,
                    depth: itx.traceAddress.length,
                    to: itx.action?.to,
                    contract: contract,
                    value: (itx.type !== 'create' && itx.action?.value !== '0')
                        ? formatWei(itx.action.value, WEI_PRECISION)
                        : 0,
                });
            }
            this.parsedItxs.sort((a, b) => {
                let deeper = (a.traceAddress.length > b.traceAddress.length) ? a : b;
                let result = 0;
                for(var i = 0; i < deeper.traceAddress.length;i++){
                    let valueA = a.traceAddress[i] || -1;
                    let valueB = b.traceAddress[i] || -1;
                    result = result + (valueA - valueB);
                }
                return result;
            });
        } catch (e) {
            console.error(`Could not retrieve internal transactions for transaction: ${e}`);
        }
        this.loading = false;
    },
    data () {
        return {
            human_readable: true,
            depth: 2,
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
        <div class="col-12 u-flex--center-y justify-between">
            <div>
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
            <div v-if="!human_readable">
                <q-toggle
                    v-model="depth"
                    :true-value="2"
                    :false-value="1"
                    checked-icon="unfold_more"
                    unchecked-icon="unfold_less"
                    color="secondary"
                    size="lg"
                />
                <span v-if="depth === 2">{{ $t('components.click_to_fold') }}</span>
                <span v-else>{{ $t('components.click_to_expand') }}</span>
            </div>
        </div>
        <div class="col-12">
            <FragmentList
                v-if="human_readable"
                :fragments="itxs"
                :parsedFragments="parsedItxs"
                        :transactionFrom="transaction.from"
            />
            <VueJsonPretty
                v-else
                :data="itxs"
                :deep="depth"
                :showLine="false"
                class="q-mb-md q-pl-md"
            />
        </div>
    </div>
</div>
</template>
