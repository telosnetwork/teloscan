<template>
<div>
    <div v-if="logs.length === 0" class="row">
        <div class="col-12 u-flex--center">
            <q-icon class="fa fa-info-circle" size="md" />
            <h3>No logs found</h3>
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
            Human-readable logs
        </div>
        <div class="col-12">
            <logs-table v-if="human_readable" :logs="logs" :contract="contract"/>
            <json-viewer
                v-else
                :value="logs"
                theme="custom-theme"
                class="q-mb-md"
            />
        </div>
    </div>
</div>
</template>

<script>
import JsonViewer from 'vue-json-viewer'
import LogsTable from 'components/Transaction/LogsTable'

export default {
    name: 'LogsViewer',
    components: {
        JsonViewer,
        LogsTable,
    },
    props: {
        contract : {
            type: Object,
            required: true,
        },
        logs: {
            type: Array,
            required: true,
        },
    },
    mounted(){
        console.log(this.logs);
    },
    data: () => ({
        human_readable: true,
    }),
}
</script>
