<script>
import LogsTableRow from 'components/Transaction/LogsTableRow'
export default {
    name: 'InternalTxnsTable',
    components: {
        LogsTableRow,
    },
    props: {
        itxs: {
            type: Array,
            required: true,
        },
        parsedItxs: {
            type: Array,
            required: true,
        },
    },
    data () {
        return {

        }
    },
}
</script>
<template>
<div class="q-pa-md">
    <div class="row">
        <div class="col-12">
            <LogsTableRow
                :key="'ltr' + i"
                v-for="(itx, i) in itxs"
                :rawLog="itx"
                :log="parsedItxs[i]"
            />
        </div>
        <div v-if="itxs.length !== parsedItxs.length" class="col-12 u-flex--center">
            <q-spinner size="md" />
        </div>
    </div>
</div>
</template>
