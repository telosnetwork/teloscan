<script>
import JsonViewer from 'vue-json-viewer';
import FragmentList from 'components/Transaction/FragmentList';
import { TRANSFER_SIGNATURES, ERC1155_TRANSFER_SIGNATURE } from 'src/lib/abi/signature/transfer_signatures';
import { BigNumber } from 'ethers';

export default {
    name: 'LogsViewer',
    components: {
        JsonViewer,
        FragmentList,
    },
    methods: {
        async getLogContract(log, type){
            try {
                return  await this.$contractManager.getContract(log.address.toLowerCase(), type);
            } catch (e) {
                console.error(`Failed to retrieve contract with address ${log.address}`);
                // notify the user
                this.$q.notify({
                    message: this.$t('components.transaction.failed_to_retrieve_contract', { address: log.address }),
                    type: 'negative',
                    position: 'top',
                });
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

    async created() {
        let verified = 0;
        for(let i = 0; i < this.logs.length; i++){
            let contract;
            const log = this.logs[i];
            const function_signature = log.topics[0].substr(0, 10);
            if(TRANSFER_SIGNATURES.includes(function_signature)) {
                let type = (log.topics.length === 4) ? 'erc721': 'erc20';
                type = (function_signature === ERC1155_TRANSFER_SIGNATURE) ? 'erc1155' : type;
                contract = await this.getLogContract(log, type);
            } else {
                contract = await this.getLogContract(log);
            }
            if (contract){
                verified = (contract.isVerified()) ? verified + 1: verified;
                let parsedLog = await contract.parseLogs([log]);
                if(parsedLog[0]){
                    parsedLog[0].contract = contract;
                    parsedLog[0].sig = function_signature;
                    this.parsedLogs.push(parsedLog[0]);
                } else {
                    let nLog = Object.assign({}, log);
                    nLog.contract = contract;
                    nLog.sig = function_signature;
                    this.parsedLogs.push(nLog);
                }
                this.parsedLogs.sort((a, b) => BigNumber.from(a.logIndex).sub(BigNumber.from(b.logIndex)).toNumber());
            }

        }

        this.allVerified = (verified === this.logs.length);
    },
    data: () => ({
        human_readable: true,
        parsedLogs: [],
        allVerified: false,
    }),
};
</script>

<template>
<div>
    <div v-if="logs.length === 0" class="row">
        <div class="col-12 u-flex--center">
            <q-icon class="fa fa-info-circle q-mr-md" size="md" />
            <h5>{{ $t('components.transaction.no_logs_found') }}</h5>
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
            {{ $t('components.transaction.human_readable') }}
            <small v-if="!allVerified">
                <q-icon name="info" class="q-mb-xs q-ml-xs" size="14px"/>
                <q-tooltip>
                    {{ $t('components.transaction.verify_related_contract') }}
                </q-tooltip>
            </small>
        </div>
        <div class="col-12">
            <FragmentList
                v-if="human_readable"
                :fragments="logs"
                :parsedFragments="parsedLogs"
            />
            <JsonViewer
                v-else
                :value="logs"
                theme="custom-theme"
                class="q-mb-md"
            />
        </div>
    </div>
</div>
</template>
