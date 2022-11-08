<script>
import JsonViewer from 'vue-json-viewer'
import FragmentList from './FragmentList.vue'
import { WEI_PRECISION, formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';

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
    created() {
        let i = 0;
        this.itxs.forEach(async (itx) => {
            let contract = await this.getContract(itx.to);
            let fnsig = itx.input.slice(0, 8);
            let name = fnsig ? 'Unknown (0x' + fnsig + ')' : 'TLOS transfer';
            let inputs, outputs, args = null;
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
                fnsig: fnsig,
                inputs: inputs,
                outputs: outputs,
                depth: itx.depth,
                to: itx.to,
                contract: contract,
                value: itx.value ? formatWei('0x' + itx.value, WEI_PRECISION): 0,
            });
            console.log(itx.traceAddress);
            console.log(itx);
            console.log(this.parsedItxs[this.parsedItxs.length - 1]);
            this.parsedItxs.sort((a,b) => {
                if(a.parent === b.parent) return a.depth - b.depth;
                return BigNumber.from(a.parent).sub(BigNumber.from(b.parent)).toNumber();
            });
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
        <div class="col-12 u-flex--center">
            <q-icon class="fa fa-info-circle q-mr-md" size="md" />
            <h3>No internal transactions found</h3>
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
