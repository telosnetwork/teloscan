<template>
<div class="q-pa-md">
    <div class="row">
        <div v-if="shapedLogs === null" class="col-12 u-flex--center">
            <q-spinner />
        </div>

        <div v-else class="col-12">
            <logs-table-row
                v-for="(log, index) in shapedLogs"
                :key="`log-row-${index}`"
                :log="log"
            />
        </div>
    </div>
</div>
</template>

<script>
import { TRANSFER_SIGNATURE } from 'src/lib/functionSignatures';

import LogsTableRow from 'components/Transaction/LogsTableRow'

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
    data: () => ({
        shapedLogs: null,
    }),
    created() {
        this.logs.forEach(async (log) => {
            let shapedLog = log;

            if (log.function_signature !== TRANSFER_SIGNATURE) {
                await this.$contractManager.getContract(log.address)
                    .then(({ token }) => {
                        shapedLog = {
                            ...log,
                            token,
                        }
                    })
                    .catch((error) => {
                        console.error(`Failed to retrieve contract with address ${log.address}: ${error}`);
                    });
            }

            if (!Array.isArray(this.shapedLogs))
                this.shapedLogs = [];

            this.shapedLogs.push(shapedLog)
        });
    },
}
</script>
