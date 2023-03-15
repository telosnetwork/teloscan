<script>
import JsonViewer from 'vue-json-viewer';
import FragmentList from 'components/Transaction/FragmentList.vue';
import { WEI_PRECISION, formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';

export default {
    name: 'InternalTxns',
    components: {
        JsonViewer,
        FragmentList,
    },
    props: {
        transaction : {
            type: Object,
            required: true,
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
        let query = `/transaction/${this.transaction.hash}/internal?limit=150&sort=ASC&offset=0`;
        try {
            let i = 0;
            let response = await this.$indexerApi.get(query);
            if(response && response.code === 200 && response.data?.results?.length > 0) {
                for (let k = 0; k < response.data.results.length; k++) {
                    let itx = response.data.results[k];
                    let contract = await this.getContract(itx.to);
                    let fnsig = itx.input.slice(0, 8);
                    let name = this.$t('components.transaction.unknown');
                    let inputs, outputs, args = false;
                    if (itx.type === 'create') {
                        name = this.$t('components.transaction.contract_deployment');
                    } else if (fnsig) {
                        name = this.$t('components.transaction.unknown') + ' (' + '0x' + fnsig + ')';
                    } else if (itx.value) {
                        name = this.$t('components.transaction.tlos_transfer');
                    }
                    if (itx.traceAddress.length < 2) {
                        itx.index = i;
                        i++;
                    }

                    if (itx.input) {
                        const parsedTransaction = await this.$contractManager.parseContractTransaction(
                            '0x' + itx.input_trimmed,
                        );

                        if (parsedTransaction) {
                            args = parsedTransaction.args;
                            name = parsedTransaction.signature;
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
                        args: args,
                        parent: itx.traceAddress[0] || itx.index,
                        name: name,
                        from: itx.from,
                        sig: '0x' + itx.input.slice(0, 8),
                        inputs: inputs,
                        outputs: outputs,
                        depth: itx.depth,
                        to: itx.to,
                        contract: contract,
                        value: (itx.type !== 'create' && itx.value) ? formatWei('0x' + itx.value, WEI_PRECISION) : 0,
                    });
                }
                this.parsedItxs.sort((a, b) => BigNumber.from(a.parent).sub(BigNumber.from(b.parent)).toNumber());
            } else {
                console.error(`Could not retrieve internal transactions for transaction ${this.transaction.hash}`,
                    response,
                );
            }
        } catch (e) {
            console.error(`Could not retrieve internal transactions for transaction ${this.transaction.hash}: ${e}`);
        }
    },
    data () {
        return {
            human_readable: true,
            parsedItxs: [],
            itxs: [],
        };
    },
};
</script>
<template>
<div>
    <div v-if="itxs.length === 0" class="row">
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
