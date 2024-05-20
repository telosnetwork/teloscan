<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { getDirection } from 'src/lib/transaction-utils';
import { contractManager, indexerApi } from 'src/boot/telosApi';
import { WEI_PRECISION } from 'src/lib/utils';

import AddressField from 'components/AddressField.vue';
import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import ValueField from 'components/ValueField.vue';
import MethodField from 'components/MethodField.vue';
import TransactionDialog from 'components/TransactionDialog.vue';
import TransactionField from 'components/TransactionField.vue';
import TransactionFeeField from 'components/TransactionFeeField.vue';

import { Pagination, PaginationByKey } from 'src/types';
import { useStore } from 'vuex';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const $i18n = useI18n();
const { t: $t } = $i18n;
const locale = $i18n.locale.value;
const $store = useStore();
const toggleDisplayDecimals = () => $store.dispatch('general/toggleDisplayDecimals');

const FIVE_HUNDRED_K = 500000;

interface Props {
    title?: string;
    initialPageSize?: number,
    block?: number,
    accountAddress?: string;
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    initialPageSize: 50,
    accountAddress: '',
});

const rows = ref<Array<any>>([]);
const loadingRows = ref<Array<number>>([]);
const loading =  ref(false);
const showDateAge = ref(true);
const showTotalGasFee = ref(true);
const highlightMethod = ref('');
const totalRows = ref(0);

const transactions: any[] = [];
const page_size_options = [10, 25, 50, 100];

const pagination = ref<PaginationByKey>(
    {
        key: 0,
        page: 0,
        descending: true,
        rowsPerPage: props.initialPageSize,
        rowsNumber: 0,
        initialKey: 0,
    },
);

const columns = [
    {
        name: 'preview',
        label: '',
        align: 'center',
    },
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
        name: 'direction',
        label: '',
        align: 'left',
    },
    {
        name: 'from',
        label: $t('components.from'),
        align: 'left',
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
        label: `${$t('components.txn_fee')}`,
        align: 'right',
    },
];

function updateColumns() {
    // we only need the direction column if we are looking at a specific account
    const index = columns.findIndex(col => col.name === 'direction');
    if (!props.accountAddress && index !== -1) {
        columns.splice(index, 1);
    } else if (props.accountAddress && index === -1) {
        columns.splice(6, 0, {
            name: 'direction',
            label: '',
            align: 'left',
        });
    }
}

watch(() => route.query,
    (query) => {
        // key=1232322&rowsPerPage=50&sort=DESC
        const { p, rowsPerPage, sort } = query;

        let page = p ? Number(p) : 0;
        let size = rowsPerPage ? Number(rowsPerPage) : pagination.value.rowsPerPage;
        let desc = sort ? sort === 'DESC' : true;

        setPagination(page, size, desc);
    },
    { immediate: true },
);

function setPagination(page: number, size: number, desc: boolean) {
    console.log('setPagination()', { page, size, desc, initialKey: pagination.value.initialKey });
    pagination.value.page = page;
    pagination.value.rowsPerPage = size;
    pagination.value.descending = desc;

    if (pagination.value.initialKey > 0) {
        // key is page pages away from the initial key
        const zero_base_page = page - 1;
        pagination.value.key = pagination.value.initialKey - (zero_base_page * pagination.value.rowsPerPage);
        console.log('setPagination() key ->', pagination.value.key);
    }
    updateColumns();
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
            p: page,
            rowsPerPage,
            sort: descending ? 'DESC' : 'ASC',
        },
    });
}

async function parseTransactions() {
    if (loading.value) {
        return;
    }
    loading.value = true;
    const { key, rowsPerPage, descending } = pagination.value;


    try {
        const path = await getPath();
        let response = await indexerApi.get(path);
        totalRows.value = response.data?.total_count;
        const results = response.data.results;
        const next = response.data.next;

        if (pagination.value.initialKey === 0) {
            pagination.value.initialKey = next + rowsPerPage;
        }

        pagination.value.key = key === 0 ? next : key;
        pagination.value.rowsPerPage = rowsPerPage;
        pagination.value.descending = descending;
        if (pagination.value.rowsNumber === 0) {
            pagination.value.rowsNumber = totalRows.value;
        }

        transactions.splice(
            0,
            transactions.length,
            ...results,
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
        // This converts the timestamp to a number regardless of the format it is in
        rows.value = transactions.map((t) => {
            if (typeof t.timestamp === 'number') {
                return t;
            } else {
                const timestamp = new Date(t.timestamp).getTime();
                const localZone = new Date().getTimezoneOffset() * 60000;
                t.timestamp = timestamp - localZone;
                return t;
            }
        });
    } catch (e: any) {
        $q.notify({
            type: 'negative',
            message: $t('components.transaction.load_error'),
            caption: e.message,
        });
        loading.value = false;
    }
}

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

async function getPath() {
    const { page, key, rowsPerPage, descending } = pagination.value;
    const limit = rowsPerPage === 0 ? 50 : Math.max(Math.min(rowsPerPage, props.initialPageSize), 10);
    let path = '';
    if (props.accountAddress) {
        path = `address/${props.accountAddress}/transactions?limit=${limit}`;
        path += `&offset=${(page - 1) * rowsPerPage}`;
        path += `&sort=${descending ? 'desc' : 'asc'}`;
        path += (pagination.value.rowsNumber === 0) ? '&includePagination=true' : '';  // We only need the count once
        if (props.block) {
            path += `&startBlock=${props.block}&endBlock=${props.block}`;
        }
    } else {
        path = `transactions?limit=${limit}`;
        if (pagination.value.initialKey === 0) {
            // in the case of the first query, we need to get the initial key
            let response = await indexerApi.get('transactions?includePagination=true&key=0');
            const next = response.data.next;
            pagination.value.initialKey = next + 1;
        }
        path += `&sort=${descending ? 'desc' : 'asc'}`;
        path += '&includePagination=true';
        path += '&includeAbi=true';
        if (props.block) {
            path += `&block=${props.block}`;
        } else {
            path += `&key=${key}`;
        }
    }
    return path;
}

function toggleDateFormat() {
    showDateAge.value = !showDateAge.value;
}

function toggleGasValue() {
    showTotalGasFee.value = !showTotalGasFee.value;
}

function setHighlightMethod(val: string) {
    highlightMethod.value = val;
}

const updateLoadingRows = () => {
    loadingRows.value = [];
    for (var i = 1; i <= pagination.value.rowsPerPage; i++) {
        loadingRows.value.push(i);
    }
};

watch(() => pagination.value.rowsPerPage, () => {
    updateLoadingRows();
});

onBeforeMount(() => {
    updateLoadingRows();
});


</script>

<template>

<div v-if="totalRows >= FIVE_HUNDRED_K">
    <div  class="c-transaction-table__limit-text">
        {{ $t('pages.transactions.five_hundred_k_disclaimer', { total: totalRows.toLocaleString(locale) }) }}
    </div>
</div>


<q-card>
    <q-table
        v-if="!loading"
        v-model:pagination="pagination"
        :rows="rows"
        :binary-state-sort="true"
        :rows-per-page-label="$t('global.records_per_page')"
        :row-key="row => row.hash"
        :columns="(columns as any)"
        :rows-per-page-options="page_size_options"
        @request="onPaginationChange"
    >
        <template v-slot:header="props">
            <q-tr :props="props">
                <q-th
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                    class="c-transaction-table__cell"
                >
                    <div v-if="col.name === 'preview'" class="u-flex--center">
                        <q-icon class="info-icon" name="far fa-question-circle"/>
                        <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                            {{ $t('pages.transactions.see_tx_preview_tooltip') }}
                        </q-tooltip>
                    </div>
                    <div v-else-if="col.name === 'date'" class="u-flex--center-y" @click="toggleDateFormat">
                        <a>{{ showDateAge ? col.label: $t('components.date') }}</a>
                        <q-icon class="info-icon q-ml-xs" name="far fa-question-circle"/>
                        <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </div>
                    <div v-else-if="col.name==='value'" class="u-flex--center-y" @click="toggleDisplayDecimals">
                        <a>{{ col.label }}</a>
                        <q-icon class="info-icon q-ml-xs" name="far fa-question-circle"/>
                        <q-tooltip anchor="bottom middle" self="bottom middle">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </div>
                    <div v-else-if="col.name === 'method'" class="u-flex--center-y">
                        {{ col.label }}
                        <q-icon class="info-icon" name="far fa-question-circle q-ml-xs" />
                        <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                            {{ $t('components.executed_based_on_decoded_data') }}
                        </q-tooltip>
                    </div>
                    <div v-else-if="col.name === 'fee'" class="u-flex--center-y" @click="toggleGasValue">
                        <a>{{ showTotalGasFee ? col.label : $t('components.gas_price') }}</a>
                        <q-icon class="info-icon" name="far fa-question-circle q-ml-xs" />
                        <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                            {{ showTotalGasFee ? $t('components.gas_price_tlos') : $t('components.gas_price_gwei') }}
                        </q-tooltip>
                    </div>
                    <template v-else>
                        {{ col.label }}
                    </template>
                </q-th>
            </q-tr>
        </template>
        <template v-slot:body="props">
            <q-tr :key="props.row.hash + props.row.parsedTransaction?.transfers?.length" :props="props">
                <q-td key="preview" :props="props" class="c-transaction-table__cell">
                    <div class="flex items-center">
                        <TransactionDialog :trx="props.row" />
                    </div>
                </q-td>
                <q-td key="hash" :props="props" class="c-transaction-table__cell">
                    <div class="c-transaction-table__hash-column flex items-center">
                        <TransactionField
                            color="primary"
                            :transaction-hash="props.row.hash"
                            :status="props.row.status === '0x1'"
                            :truncate="13"
                        />
                    </div>
                </q-td>
                <q-td key="method" :props="props" class="c-transaction-table__cell">
                    <MethodField
                        :trx="props.row"
                        :shortenName="true"
                        :highlightMethod="highlightMethod"
                        @highlight="setHighlightMethod"
                    />
                </q-td>
                <q-td key="block" :props="props" class="c-transaction-table__cell">
                    <BlockField :block="props.row.blockNumber"/>
                </q-td>
                <q-td key="date" :props="props" @click="toggleDateFormat">
                    <DateField :epoch="props.row.timestamp / 1000" :force-show-age="showDateAge"/>
                </q-td>
                <q-td key="direction" :props="props">
                    <span
                        :class="`direction ${getDirection(accountAddress, props.row)}`"
                    >
                        {{ $t(`components.transaction.${getDirection(accountAddress, props.row)}`).toUpperCase() }}
                    </span>
                </q-td>
                <q-td key="from" :props="props" class="c-transaction-table__cell">
                    <AddressField
                        v-if="props.row.from"
                        :key="'trx-from-'+ props.row.from"
                        :address="props.row.from"
                        :truncate="12"
                        :copy="true"
                    />
                </q-td>
                <q-td key="to" :props="props" class="c-transaction-table__cell">
                    <AddressField
                        v-if="props.row.to"
                        :key="'trx-to-'+ props.row.to"
                        :address="props.row.to"
                        :truncate="12"
                        :copy="true"
                    />
                </q-td>
                <q-td key='value' :props="props" class="c-transaction-table__cell">
                    <ValueField
                        :value="props.row.value"
                        :symbol="'TLOS'"
                        :decimals="WEI_PRECISION"
                    />
                </q-td>
                <q-td key='fee' :props="props" class="c-transaction-table__cell">
                    <TransactionFeeField
                        :showTotalGasFee="showTotalGasFee"
                        :gasUsed="props.row.gasused ?? props.row.gasUsed"
                        :gasPrice="props.row.gasPrice"
                    />
                </q-td>
            </q-tr>
        </template>
    </q-table>
    <q-table
        v-else
        v-model:pagination="pagination"
        :rows="loadingRows"
        :rows-per-page-label="$t('global.records_per_page')"
        :columns="(columns as any)"
        :rows-per-page-options="page_size_options"
    >
        <template v-slot:header="props">
            <q-tr :props="props">
                <q-th
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                    class="c-transaction-table__cell"
                >
                    <div v-if="col.name === 'preview'" class="u-flex--center">
                        <q-icon class="info-icon" name="far fa-question-circle"/>
                        <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                            {{ $t('pages.transactions.see_tx_preview_tooltip') }}
                        </q-tooltip>
                    </div>
                    <div v-if="col.name === 'date'" class="u-flex--center-y" @click="toggleDateFormat">
                        <a>{{ showDateAge ? col.label: $t('components.date') }}</a>
                        <q-icon class="info-icon q-ml-xs" name="far fa-question-circle"/>
                        <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </div>
                    <div v-else-if="col.name === 'method'" class="u-flex--center-y">
                        {{ col.label }}
                        <q-icon class="info-icon" name="far fa-question-circle q-ml-xs" />
                        <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                            {{ $t('components.executed_based_on_decoded_data') }}
                        </q-tooltip>
                    </div>
                    <div v-else-if="col.name === 'fee'" class="u-flex--center-y" @click="toggleGasValue">
                        <a>{{ showTotalGasFee ? col.label : $t('components.gas_price') }}</a>
                        <q-icon class="info-icon" name="far fa-question-circle q-ml-xs" />
                        <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                            {{ showTotalGasFee ? $t('components.gas_price_tlos') : $t('components.gas_price_gwei') }}
                        </q-tooltip>
                    </div>
                    <template v-else>
                        {{ col.label }}
                    </template>
                </q-th>
            </q-tr>
        </template>
        <template v-slot:body="">
            <q-tr>
                <q-td key="preview" class="c-transaction-table__cell">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="hash" class="c-transaction-table__cell">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="method" class="c-transaction-table__cell">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="block"  class="c-transaction-table__cell">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="date">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="direction" >
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="from"  class="c-transaction-table__cell">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="to"  class="c-transaction-table__cell">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key='value' class="c-transaction-table__cell">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key='fee' class="c-transaction-table__cell">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
            </q-tr>
        </template>
    </q-table>
</q-card>

</template>
<style lang="scss">

.direction {
  @include direction;
}
// quasar override
.sortable {
    height: 60px;
    display: flex;
    gap: 4px;
    align-items: center;
}

.c-transaction-table {
    &__limit-text {
        height: 26px;
        color: var(--text-color);
        font-size: 0.8rem;
        text-align: left;
        margin-bottom: 12px;
    }

    &__hash-column{
        min-width: 130px;
    }

    &__cell {
        padding: 7px 13px !important;
    }
}
</style>


