<template>
<div class="q-pa-md">
    <div class="row">

        <div class="col-12">
            <logs-table-row
                v-for="(log, index) in logs"
                :key="`log-row-${index}`"
                :log="log"
            />
        </div>
        <div v-if="logs.length !== rowCount" class="col-12 u-flex--center">
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
        rowCount: {
            type: Number,
            required: true,
        },
        logs: {
            type: Array,
            required: true,
        },
    },
}
</script>
