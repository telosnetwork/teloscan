<script>
import JsonViewer from 'vue-json-viewer'
import InternalTxnsTable from './InternalTxnsTable.vue'

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
            required: true,
        },
    },
    created() {

        this.itxs.forEach(async (itx) => {
            console.log(itx);
            this.parsedItxs.push(itx);
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
                :rawLogs="itxs"
                :logs="parsedItxs"
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
