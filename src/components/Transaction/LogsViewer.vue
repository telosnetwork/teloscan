<script>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import FragmentList from 'components/Transaction/FragmentList';
import { BigNumber } from 'ethers';

export default {
    name: 'LogsViewer',
    components: {
        VueJsonPretty,
        FragmentList,
    },
    methods: {
        async getLogContract(log){
            try {
                return await this.$contractManager.getContract(log.address);
            } catch (e) {
                console.error(`Failed to retrieve contract with address ${log.address}: ${e}`);
                this.$q.notify({
                    message: this.$t('components.transaction.failed_to_retrieve_contract', { address: log.address }),
                    type: 'negative',
                    position: 'top',
                });
            }
        },
    },
    props: {
        trx : {
            type: Object,
            required: false,
        },
        contract : {
            type: Object,
            required: false,
        },
        logs: {
            type: Array,
            required: false,
            default: () => [],
        },
    },

    async created() {
        let verified = 0;
        for(let i = 0; i < this.logs?.length; i++){
            let log = this.logs[i];
            if(this.trx){
                log.blockNumber = this.trx.blockNumber;
                log.transactionIndex = this.trx.index;
                log.transactionHash = this.trx.hash;
            }
            this.rawLogs.push({ ...log });
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
            } else {
                let nLog = Object.assign({}, log);
                this.parsedLogs.push(nLog);
                this.$q.notify({
                    message: this.$t('components.transaction.failed_to_retrieve_contract', { address: log.address }),
                    type: 'negative',
                    position: 'top',
                });
            }
        }
        this.parsedLogs.sort((a, b) => BigNumber.from(a.logIndex).sub(BigNumber.from(b.logIndex)).toNumber());
        this.allVerified = (verified === this.logs?.length);
    },
    data () {
        return ({
            human_readable: true,
            parsedLogs: [],
            rawLogs: [],
            allVerified: false,
        });
    },
};
</script>

<template>
<div>
    <div v-if="logs === null || logs.length === 0" class="row">
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
                :fragments="rawLogs"
                :parsedFragments="parsedLogs"
                :transactionFrom="trx.from"
            />
            <VueJsonPretty
                v-else
                :data="rawLogs"
                :showLine="false"
                :deep="2"
                class="q-pl-md"
            />
        </div>
    </div>
</div>
</template>
