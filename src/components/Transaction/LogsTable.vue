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
import { TRANSFER_FUNCTION_SIGNATURES } from 'src/lib/functionSignatures';

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
    data: () => ({
        shapedLogs: null,
    }),
    created() {
        this.logs.forEach(async (log) => {
            let shapedLog = log;
            if(!this.contract || log.address !== this.contract.address){
                const metadata = await this.$contractManager.checkBucket(log.address);
                let log_contract;
                if (metadata) {
                    log_contract = await this.$contractManager.getVerifiedContract(log.address.toLowerCase(), metadata);
                } else {
                    log_contract = await this.$contractManager.getContract(log.address.toLowerCase());
                }
                if(log_contract){
                    let logs = await log_contract.parseLogs([log]);
                    shapedLog = logs[0];
                    shapedLog.address = log.address;
                    shapedLog.function_signature = shapedLog.topic ? shapedLog.topic.substr(0, 10) : shapedLog.topics[0].substr(0, 10);
                    shapedLog.name = shapedLog.signature;
                }
            }

            if (TRANSFER_FUNCTION_SIGNATURES.includes(shapedLog.function_signature)) {
                shapedLog.isTransfer = true;
                try {
                    shapedLog.token = await this.$contractManager.getTokenData(log.address, 'erc20');
                } catch (e) {
                    console.error(`Failed to retrieve contract with address ${log.address}: ${e.message}`);
                }
            }

            if (!Array.isArray(this.shapedLogs))
                this.shapedLogs = [];

            this.shapedLogs.push(shapedLog)
        });
    },
}
</script>
