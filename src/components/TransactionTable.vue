<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatWei } from 'src/lib/utils';

import { contractManager, indexerApi } from 'src/boot/telosApi';

import TokenValueField from 'components/Token/TokenValueField.vue';
import AddressField from 'components/AddressField.vue';
import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import TransactionField from 'components/TransactionField.vue';
import MethodField from 'components/MethodField.vue';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { t: $t } = useI18n();

interface Props {
    title?: string;
    filter?: string | object;
    initialPageSize?: number,
    block?: number,
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    initialPageSize: 1,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rows = ref<Array<any>>([]);
const filterUpdated = ref(false);
const loading =  ref(false);
const showDateAge = ref(true);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transactions: any[] = [];
const page_size_options = [10, 25, 50, 100];

type Pagination = {
    sortBy: string;
    descending: boolean;
    page: number;
    rowsPerPage: number;
    rowsNumber: number;
}

const pagination = ref<Pagination>(
    {
        sortBy: 'block',
        descending: true,
        page: 1,
        rowsPerPage: 50,
        rowsNumber: 0,
    },
);

const columns = [
    {
        name: 'hash',
        label: $t('components.tx_hash'),
        align: 'left',
    },
    {
        name: 'method',
        label: $t('components.method'),
        align: 'left',
    },
    {
        name: 'block',
        label: $t('components.block'),
        align: 'left',
        sortable: true,
    },
    {
        name: 'date',
        label: $t('components.age'),
        align: 'left',
    },
    {
        name: 'from',
        label: $t('components.from'),
        align: 'left',
    },
    {
        name: 'direction',
        label: '',
        align: 'center',
    },
    {
        name: 'to',
        label: $t('components.to_interacted_with'),
        align: 'left',
    },
    {
        name: 'value',
        label: $t('components.value'),
        align: 'left',
    },
    {
        name: 'fee',
        label: $t('components.txn_fee'),
        align: 'left',
    },
];

watch(() => route.query.page,
    (pageParam) => {
        let page = 1;
        let desc = true;
        let size = page_size_options[0];

        // we also allow to pass a single number as the page number
        if (typeof pageParam === 'number') {
            page = pageParam;
        } else if (typeof pageParam === 'string') {
            // we also allow to pass a string of two numbers: 'page,rowsPerPage'
            const [p, s, d] = pageParam.split(',');
            page = Number(p);
            size = Number(s);
            desc = (!d || d.toUpperCase() !== 'ASC');
        }

        setPagination(page, size, desc);
    },
    { immediate: true },
);

watch(() => props.filter,
    async () => {
        if (!filterUpdated.value) {
            filterUpdated.value = true;
            return;
        }
        await parseTransactions();
    },
);

function setPagination(page: number, size: number, desc: boolean) {
    if (page) {
        pagination.value.page = page;
    }
    if (size) {
        pagination.value.rowsPerPage = size;
    }
    pagination.value.descending = desc;
    parseTransactions();
}

async function onPaginationChange(settings: { pagination: Pagination}) {
    const { page, rowsPerPage, descending } = settings.pagination;
    // we need to change the URL to keep the pagination state by changing the route.query.page
    // with a string like 'page,rowsPerPage'
    router.push({
        // taking care to preserve the current #hash anchor and the current query parameters
        hash: window.location.hash,
        query: {
            ...route.query,
            page: `${page},${rowsPerPage},${(descending) ? 'DESC' : 'ASC'}`,
        },
    });
}

async function parseTransactions() {
    if(loading.value){
        return;
    }
    loading.value = true;
    const { page, rowsPerPage, sortBy, descending } = pagination.value;

    try {
        let response = await indexerApi.get(getPath());
        if (pagination.value.rowsNumber === 0) {
            pagination.value.rowsNumber = response.data?.total_count;
        }

        pagination.value.page = page;
        pagination.value.rowsPerPage = rowsPerPage;
        pagination.value.sortBy = sortBy;
        pagination.value.descending = descending;

        transactions.splice(
            0,
            transactions.length,
            ...response.data.results,
        );
        rows.value = transactions;
        for (const transaction of transactions) {
            try {
                if (transaction.input === '0x') {
                    continue;
                }
                if(!transaction.to) {
                    continue;
                }

                addEmptyToCache(response.data.contracts, transaction);

                const contract = await contractManager.getContract(transaction.to);

                if (!contract) {
                    continue;
                }

                const parsedTransaction = await contractManager.parseContractTransaction(
                    transaction, transaction.input, contract, true,
                );
                if (parsedTransaction) {
                    transaction.parsedTransaction = parsedTransaction;
                }
                transaction.contract = contract;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                console.error(
                    `Failed to parse data for transaction, error was: ${e.message}`,
                );
                $q.notify({
                    message: $t('components.failed_to_parse_transaction', { message: e.message }),
                    color: 'negative',
                    position: 'top',
                    timeout: 5000,
                });
            }
        }
        loading.value = false;
        rows.value = transactions;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        $q.notify({
            type: 'negative',
            message: $t('components.transaction.load_error'),
            caption: e.message,
        });
        loading.value = false;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addEmptyToCache(contracts: any, transaction: any){
    let found_to = 0;
    let found_from = 0;
    for(const contract in contracts){
        if(contract.toLowerCase() === transaction.to.toLowerCase()) {
            found_to++;
        }
        if(contract.toLowerCase() === transaction.from.toLowerCase()) {
            found_from++;
        }
    }
    if(found_from === 0){
        contractManager.addContractToCache(transaction.from, { 'address': transaction.from });
    }
    if(found_to === 0){
        contractManager.addContractToCache(transaction.to, { 'address': transaction.to });
    }
}

function getPath() {
    const { page, rowsPerPage, descending } = pagination.value;
    const filter =  props.filter  ? props.filter.toString() : '';
    let path = `${filter}/transactions?limit=${
        rowsPerPage === 0 ? 500 : rowsPerPage
    }`;
    path += `&offset=${(page - 1) * rowsPerPage}`;
    path += `&sort=${descending ? 'desc' : 'asc'}`;
    path += (pagination.value.rowsNumber === 0) ? '&includePagination=true' : '';  // We only need the count once
    path += '&includeAbi=true';
    if (props.block){
        path += `&block=${props.block}`;
    }
    return path;
}

function toggleDateFormat() {
    showDateAge.value = !showDateAge.value;
}

function getGasFee(gasUsed: number, gasPrice: number){
    const gasCost = BigInt(gasUsed * gasPrice);
    const formatted = formatWei(gasCost, 18, 3);
    return `${formatted} TLOS`;
}

</script>

<template>
<q-table
    v-model:pagination="pagination"
    :rows="rows"
    :binary-state-sort="true"
    :rows-per-page-label="$t('global.records_per_page')"
    :row-key="row => row.hash"
    :columns="(columns as any)"
    :loading="loading"
    :rows-per-page-options="page_size_options"
    flat
    @request="onPaginationChange"
>
    <template v-slot:loading>
        <q-inner-loading showing color="secondary" />
    </template>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <div v-if="col.name === 'date'" class="u-flex--center-y" @click="toggleDateFormat">
                    {{ showDateAge ? col.label: $t('components.date') }}
                    <q-icon
                        class="info-icon q-ml-xs"
                        name="fas fa-info-circle"
                    >
                        <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </q-icon>
                </div>
                <div v-else-if="col.name === 'method'" class="u-flex--center-y">
                    {{ col.label }}
                    <q-icon class="info-icon" name="fas fa-info-circle q-ml-xs" />
                    <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                        {{ $t('components.executed_based_on_decoded_data') }}
                    </q-tooltip>
                </div>
                <div v-else class="u-flex--center-y">
                    {{ col.label }}
                </div>
            </q-th>
        </q-tr>
    </template>
    <template v-slot:body="props">
        <q-tr :key="props.row.hash + props.row.parsedTransaction?.transfers?.length" :props="props">
            <q-td key="hash" :props="props">
                <div class="flex items-center">
                    <q-icon
                        v-if="props.row.status !== '0x1'"
                        class="q-mr-xs"
                        name="warning"
                        color="negative"
                    />
                    <TransactionField
                        :color="(props.row.status !== '0x1') ? 'negative' : 'primary'"
                        :transaction-hash="props.row.hash"
                        :truncate="(props.row.status !== '0x1') ? 15 : 18"
                    />
                </div>
            </q-td>
            <q-td key="method" :props="props">
                <MethodField :trx="props.row" :shortenName="true"/>
            </q-td>
            <q-td key="block" :props="props">
                <BlockField :block="props.row.blockNumber"/>
            </q-td>
            <q-td key="date" :props="props" @click="toggleDateFormat">
                <DateField :epoch="props.row.timestamp / 1000" :force-show-age="showDateAge"/>
            </q-td>
            <q-td key="from" :props="props">
                <AddressField
                    v-if="props.row.from"
                    :key="'trxt'+ props.row.from"
                    :address="props.row.from"
                    :truncate="14"
                />
            </q-td>
            <q-td key="direction">
                <q-icon size="12px" name="fas fa-arrow-right"/>
            </q-td>
            <q-td key="to" :props="props">
                <AddressField
                    v-if="props.row.to"
                    :key="'trxt'+ props.row.to"
                    :address="props.row.to"
                    :truncate="14"
                />
            </q-td>
            <q-td key='value' :props="props">
                <TokenValueField v-if="props.row.value > 0" :value="BigInt(props.row.value).toString(10) || '0.0'" />
                <span v-else-if="props.row.parsedTransaction?.transfers?.length > 0">
                    <TokenValueField
                        v-if="props.row.parsedTransaction?.transfers?.length > 0"
                        :value="props.row.parsedTransaction.transfers[0].value.toString(16) || '0.0'"
                        :address="props.row.parsedTransaction.transfers[0].address"
                    />
                </span>
                <TokenValueField v-else :value="'0.0'" />
            </q-td>
            <q-td key='fee' :props="props">
                {{ getGasFee(props.row.gasused, props.row.gasPrice) }}
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>
<!--eslint-enable-->
<style scoped lang="sass">
    .direction
        user-select: none
        padding: 3px 6px
        border-radius: 5px
        font-size: 0.9em
    .direction.in
        color: rgb(0,161,134)
        background: rgba(0,161,134,0.1)
        border: 1px solid rgb(0,161,134)
    .direction.out
        color: #cc9a06!important
        background: rgba(255,193,7,0.1)
        border: 1px solid #cc9a06!important
    .sortable
        height: 60px
        display: flex
        align-items: center
</style>

