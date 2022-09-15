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
            <logs-table
                v-if="human_readable"
                :rowCount="logs.length"
                :rawLogs="logs"
                :logs="shapedLogs"
                :contract="contract"
            />
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
import { TRANSFER_FUNCTION_SIGNATURES } from 'src/lib/functionSignatures';
import { BigNumber } from 'ethers';

export default {
    name: 'LogsViewer',
    components: {
        JsonViewer,
        LogsTable,
    },
    methods: {
        async getLogContract(log){
            const metadata = await this.$contractManager.checkBucket(log.address);
            if (metadata) {
                return  await this.$contractManager.getVerifiedContract(log.address.toLowerCase(), metadata);
            } else {
                return  await this.$contractManager.getContract(log.address.toLowerCase());
            }
        },
    },
    props: {
        contract : {
            type: Object,
            required: false,
        },
        logs: {
            type: Array,
            required: true,
        },
    },

    created() {
        let contracts = {};
        this.logs.forEach(async (log) => {
            let shapedLog = { ...log };
            shapedLog.isTransfer = false;
            if(!this.contract || log.address !== this.contract.address){
                let log_contract;
                if (Object.prototype.hasOwnProperty.call(contracts, log.address)){
                    log_contract = contracts[log.address]
                } else {
                    log_contract = await this.getLogContract(log);
                    contracts[log.address] = log_contract;
                }
                if(log_contract){
                    let logs = await log_contract.parseLogs([shapedLog]);
                    shapedLog = logs[0];
                    shapedLog.logIndex = log.logIndex;
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
            this.shapedLogs.push(shapedLog);
            this.shapedLogs.sort((a,b) => BigNumber.from(a.logIndex).toNumber() - BigNumber.from(b.logIndex).toNumber());
        });
    },
    data: () => ({
        human_readable: true,
        shapedLogs: [],
    }),
}
</script>
