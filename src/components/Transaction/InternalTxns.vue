<script>
import JsonViewer from 'vue-json-viewer'
import InternalTxnsTable from './InternalTxnsTable.vue'
import { WEI_PRECISION, formatWei} from 'src/lib/utils';

export default {
    name: 'InternalTxns',
    components: {
        JsonViewer,
        InternalTxnsTable,
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
        this.itxs.forEach(async (itx) => {
            let contract = await this.getContract(itx.to);
            let fnsig = itx.input.slice(0, 8);
            let name = fnsig ? 'Unknown (0x' + fnsig + ')' : 'TLOS transfer';
            let inputs = null;
            let args = null;

            if(itx.input_trimmed){
                const parsedTransaction = await contract.parseTransaction(
                    '0x' + itx.input_trimmed,
                );

                if(parsedTransaction){
                    args = parsedTransaction.args;
                    name = parsedTransaction.signature;
                    inputs = parsedTransaction.functionFragment ? parsedTransaction.functionFragment.inputs : parsedTransaction.inputs;
                }
            }

            this.parsedItxs.push({
                args: args,
                name: name,
                from: itx.from,
                fnsig: fnsig,
                inputs: inputs,
                type: itx.callType,
                depth: itx.depth,
                to: itx.to,
                contract: contract,
                value: itx.value ? formatWei('0x' + itx.value, WEI_PRECISION): 0,
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
            <internal-txns-table
                v-if="human_readable"
                :itxs="itxs"
                :parsedItxs="parsedItxs"
                :contract="contract"
            />
            <json-viewer
                v-else
                :value="itxs"
                theme="custom-theme"
                class="q-mb-md"
            />
        </div>
    </div>
</div>
</template>
