<template>
<div>
    <div v-if="logs.length === 0" class="row">
        <div class="col-12 u-flex--center">
            <q-icon class="fa fa-info-circle q-mr-md" size="md" />
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
            <small v-if="!allVerified">
                <q-icon name="info" class="q-mb-xs q-ml-xs" size="14px"/>
                <q-tooltip>Verify the related contracts of each log to see its human readable version</q-tooltip>
            </small>
        </div>
        <div class="col-12">
            <logs-table
                v-if="human_readable"
                :rawLogs="logs"
                :logs="parsedLogs"
                :allVerified="allVerified"
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
import { TRANSFER_FUNCTION_SIGNATURES } from 'src/lib/abi/signature/functionSignatures';
import { BigNumber } from 'ethers';

export default {
    name: 'LogsViewer',
    components: {
        JsonViewer,
        LogsTable,
    },
    methods: {
        async getLogContract(log, type){
            return  await this.$contractManager.getContract(log.address.toLowerCase(), type);
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
        let verified = 0;
        this.logs.forEach(async (log) => {
            let parsedLog = { ...log };
            let log_contract;
            const function_signature = parsedLog.topics[0].substr(0, 10);
            if (Object.prototype.hasOwnProperty.call(contracts, log.address)){
                log_contract = contracts[log.address]
            } else if(TRANSFER_FUNCTION_SIGNATURES.includes(function_signature)) {
                parsedLog.isTransfer = true;
                try {
                    const type = (log.topics.length === 4) ? 'erc721': 'erc20';
                    log_contract = await this.getLogContract(log, type);
                    contracts[log.address] = log_contract;
                } catch (e) {
                    console.error(`Failed to retrieve contract with address ${log_contract.address}: ${e.message}`);
                }
            } else {
                parsedLog.isTransfer = false;
                log_contract = await this.getLogContract(log);
                contracts[log.address] = log_contract;
            }
            verified = (log_contract.isVerified()) ? verified + 1: verified;
            if(log_contract){
                let isTransfer = parsedLog.isTransfer;
                let logs = await log_contract.parseLogs([parsedLog]);
                parsedLog = logs[0];
                parsedLog.isTransfer = isTransfer;
                parsedLog.logIndex = log.logIndex;
                parsedLog.address = log.address;
                parsedLog.function_signature = function_signature;
                parsedLog.name = parsedLog.signature;
                if(log_contract.token){
                    parsedLog.token = log_contract.token;
                }
            }
            console.log(parsedLog)
            this.allVerified = (verified == this.logs.length);
            this.parsedLogs.push(parsedLog);
            this.parsedLogs.sort((a,b) => BigNumber.from(a.logIndex).toNumber() - BigNumber.from(b.logIndex).toNumber());
        });
    },
    data: () => ({
        human_readable: true,
        parsedLogs: [],
        allVerified: false,
    }),
}
</script>
