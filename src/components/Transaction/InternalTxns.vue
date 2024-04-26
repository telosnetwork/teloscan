<script>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import FragmentList from 'components/Transaction/FragmentList.vue';
import { getParsedInternalTransactions } from 'src/lib/transaction-utils';


export default {
    name: 'InternalTxns',
    components: {
        VueJsonPretty,
        FragmentList,
    },
    props: {
        traces : {
            type: Object,
            required: false,
        },
        transaction : {
            type: Object,
            required: false,
            default: null,
        },
    },
    methods: {
        async getContract(address){
            try {
                return  await this.$contractManager.getContract(address);
            } catch (e) {
                console.error(`Failed to retrieve contract with address ${address}`);
                // Notify the user
                this.$q.notify({
                    message: this.$t('components.transaction.failed_to_retrieve_contract', { address }),
                    type: 'negative',
                    position: 'top',
                });
            }
        },
    },
    async created() {
        this.loading = true;
        const { parsedItxs, itxs } = await getParsedInternalTransactions(this.transaction.hash, this.$t);
        this.parsedItxs = parsedItxs;
        this.itxs = itxs;
        this.loading = false;
    },
    data () {
        return {
            human_readable: true,
            depth: 2,
            parsedItxs: [],
            loading:  true,
            itxs: [],
        };
    },
};

</script>
<template>
<div>
    <div v-if="loading" class="row center justify-center items-center">
        <q-spinner size="md" />
    </div>
    <div v-else-if="itxs.length === 0" class="row">
        <div class="col-12 flex items-center justify-center">
            <q-icon class="fa fa-info-circle" size="md" />
            <h5 class="text-center  q-ma-md"> {{ $t('components.transaction.no_internal_trxs_found') }}</h5>
        </div>
    </div>
    <div v-else class="row">
        <div class="col-12 u-flex--center-y justify-between">
            <div>
                <q-toggle
                    v-model="human_readable"
                    icon="visibility"
                    color="primary"
                    size="lg"
                />
                {{ $t('components.transaction.human_readable') }}
                <small>
                    <q-icon name="info" class="q-mb-xs q-ml-xs" size="14px"/>
                    <q-tooltip>
                        {{ $t('components.transaction.verify_related_contract') }}
                    </q-tooltip>
                </small>
            </div>
            <div v-if="!human_readable">
                <q-toggle
                    v-model="depth"
                    :true-value="2"
                    :false-value="1"
                    checked-icon="unfold_more"
                    unchecked-icon="unfold_less"
                    color="primary"
                    size="lg"
                />
                <span v-if="depth === 2">{{ $t('components.click_to_fold') }}</span>
                <span v-else>{{ $t('components.click_to_expand') }}</span>
            </div>
        </div>
        <div class="col-12">
            <FragmentList
                v-if="human_readable"
                :fragments="itxs"
                :parsedFragments="parsedItxs"
                :transactionFrom="transaction.from"
            />
            <VueJsonPretty
                v-else
                :data="itxs"
                :deep="depth"
                :showLine="false"
                class="q-mb-md q-pl-md"
            />
        </div>
    </div>
</div>
</template>
