<script>
import JsonViewer from 'vue-json-viewer';
import FragmentList from 'components/Transaction/FragmentList';
import { BigNumber } from 'ethers';

export default {
    name: 'LogsViewer',
    components: {
        JsonViewer,
        FragmentList,
    },
    methods: {
        async getLogContract(log){
            try {
                return await this.$contractManager.getContract(log.address.toLowerCase());
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
            const log = this.logs[i];
            let contract = await this.getLogContract(log);
            if (contract){
                verified = (contract.isVerified()) ? verified + 1: verified;
                let parsedLog = await this.$fragmentParser.parseLog(log, contract);
                if(parsedLog){
                    this.parsedLogs.push(parsedLog);
                } else {
                    let nLog = Object.assign({}, log);
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
