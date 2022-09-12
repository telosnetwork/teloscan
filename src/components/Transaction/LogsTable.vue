<script>
import LogsTableRow from './LogsTableRow'

export default {
    name: 'LogsTable',
    components: {
        LogsTableRow,
    },
    props: {
        logs: {
            type: Array,
            required: true,
        },
    },
}
</script>
<template lang="pug">
div.q-pa-md
  LogsTableRow(v-for="(log, index) in logs" :log="log" :key="'logRow' + index")
</template>
