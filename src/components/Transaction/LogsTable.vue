<template>
<div class="q-pa-md">
    <div class="row">
        <div v-if="logs === null" class="col-12 u-flex--center">
            <q-spinner size="md" />
        </div>

        <div v-else class="col-12">
            <logs-table-row
                v-for="(log, index) in logs"
                :key="`log-row-${index}`"
                :log="log"
            />
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
        logs: {
            type: Array,
            required: true,
        },
    },
}
</script>
