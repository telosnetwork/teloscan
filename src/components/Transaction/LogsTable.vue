<template>
<div class="q-pa-md">
    <div class="row">
        <div class="col-12">
            <logs-table-row
                v-for="(log, index) in logs"
                :key="`log-row-${index}`"
                :log="log"
                :rawLog="rawLogs[index]"
            />
        </div>
        <div v-if="logs.length !== rawLogs.length" class="col-12 u-flex--center">
            <q-spinner size="md" />
        </div>
    </div>
</div>
</template>

<script>
import LogsTableRow from 'components/Transaction/LogsTableRow'

export default {
    name: 'LogsTable',
    components: {
        LogsTableRow,
    },
    props: {
        contract : {
            type: Object,
            required: true,
        },
        rawLogs: {
            type: Array,
            required: true,
        },
        allVerified: {
            type: Boolean,
        },
        logs: {
            type: Array,
            required: true,
        },
    },
}
</script>
