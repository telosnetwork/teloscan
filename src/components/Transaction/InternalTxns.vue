<script>
import JsonViewer from 'vue-json-viewer'
import FragmentList from './FragmentList.vue'
import { WEI_PRECISION, formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';

const TLOS_TRANSFER = 'TLOS Transfer';
const CONTRACT_DEPLOYMENT = 'Contract Deployment';

export default {
    name: 'InternalTxns',
    components: {
        JsonViewer,
        FragmentList,
    },
    props: {
        itxs: {
            type: Array,
            required: true,
        },
        contract: {
            type: Object,
            required: false,
        },
    },
    methods: {
        async getContract(address){
            try {
                return  await this.$contractManager.getContract(address);
            } catch (e) {
                console.error(`Failed to retrieve contract with address ${address}`);
            }
        },
    },
    async created() {
        let i = 0;
        for(let k = 0; k < this.itxs.length;k++){
            let itx = this.itxs[k];
            let contract = await this.getContract(itx.to);
            let fnsig =  itx.input.slice(0, 8);
            let name = 'Unknown';
            let inputs, outputs, args  = false;
            if(itx.type === 'create'){
                name = CONTRACT_DEPLOYMENT;
            } else if (fnsig){
                name = 'Unknown (' + '0x' + fnsig + ')';
            } else if (itx.value){
                name = TLOS_TRANSFER;
            }
            if(itx.traceAddress.length < 2){
                itx.index = i;
                i++;
            }

            if(itx.input_trimmed){
                const parsedTransaction = await contract.parseTransaction(
                    '0x' + itx.input_trimmed,
                );

                if(parsedTransaction){
                    args = parsedTransaction.args;
                    name = parsedTransaction.signature;
                    outputs = parsedTransaction.functionFragment ? parsedTransaction.functionFragment.outputs : parsedTransaction.outputs;
                    inputs = parsedTransaction.functionFragment ? parsedTransaction.functionFragment.inputs : parsedTransaction.inputs;
                }
            }
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
                value: (itx.type !== 'create' && itx.value) ? formatWei('0x' + itx.value, WEI_PRECISION): 0,
            });
        }
        this.parsedItxs.sort((a,b) => {
            return BigNumber.from(a.parent).sub(BigNumber.from(b.parent)).toNumber();
        });

    },
    data () {
        return {
            human_readable: true,
            parsedItxs: [],
        }
    },
}
</script>
<template>
<div>
    <div v-if="itxs.length === 0" class="row">
        <div class="col-12 flex items-center justify-center">
            <q-icon class="fa fa-info-circle" size="md" />
            <h5 class="text-center  q-ma-md">No internal transactions found</h5>
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
            Human-readable
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
