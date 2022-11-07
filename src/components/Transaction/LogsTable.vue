<template>
<div class="q-pa-md">
    <div class="row">
        <div class="col-12">
            <FragmentTableRow
                v-for="(log, index) in logs"
                :key="`log-row-${index}`"
                :fragment="log"
                :rawFragment="rawLogs[index]"
            />
        </div>
        <div v-if="logs.length !== rawLogs.length" class="col-12 u-flex--center">
            <q-spinner size="md" />
        </div>
    </div>
</div>
</template>

<script>
import FragmentTableRow from 'components/Transaction/FragmentTableRow'

export default {
    name: 'LogsTable',
    components: {
        FragmentTableRow,
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
