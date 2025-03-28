<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
// src/components/TransactionTable.vue
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { onBeforeMount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { getDirection } from 'src/lib/transaction-utils';
import { writePaginationToURL, readPaginationFromURL } from 'src/lib/pagination';

import AddressField from 'components/AddressField.vue';
import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import ValueField from 'components/ValueField.vue';
import MethodField from 'components/MethodField.vue';
import TransactionDialog from 'components/TransactionDialog.vue';
import TransactionField from 'components/TransactionField.vue';
import TransactionFeeField from 'components/TransactionFeeField.vue';
import EmptyTableSign from 'components/EmptyTableSign.vue';
import TablePagination from 'src/components/TablePagination.vue';

import { PaginationByKey } from 'src/types';
import { useStore } from 'vuex';
import { useChainStore } from 'src/core';
import { BigNumber } from 'ethers';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const routers = {
    router,
    route,
};
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
    accountAddress?: string,
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    initialPageSize: 50,
    accountAddress: '',
});

const rows = ref<Array<any>>([]);
const loadingRows = ref<Array<number>>([]);
const loading = ref(false);
const showDateAge = ref(true);
const showTotalGasFee = ref(true);
const highlightMethod = ref('');
const totalRows = ref(0);
const entryName = $t('components.table_pagination.transactions');
const table = 'transactions';

const transactions: any[] = [];
const page_size_options = [10, 25, 50, 100];

const pagination = ref<PaginationByKey>({
    key: 0,
    page: 1,
    descending: true,
    rowsPerPage: props.initialPageSize,
    rowsNumber: 0,
    initialKey: 0,
});

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

function updateColumns () {
    // Only show the direction column if looking at a specific account
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

function setPagination (page: number, size: number) {
    pagination.value.page = page;
    pagination.value.rowsPerPage = size;
    if (pagination.value.initialKey > 0) {
        // Key is pages away from the initial key (using 1-indexed page)
        const zeroBasePage = page - 1;
        pagination.value.key = pagination.value.initialKey - (zeroBasePage * pagination.value.rowsPerPage);
    }
    updateColumns();
    onRequest();
}

async function onPaginationChange (settings: { pagination: PaginationByKey }) {
    const { page, rowsPerPage } = settings.pagination;
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;

    // Write pagination state to URL using the library function
    writePaginationToURL(page, rowsPerPage, props.initialPageSize, routers);

    await onRequest();
}

async function onRequest () {
    if (loading.value) {
        return;
    }
    loading.value = true;
    const { rowsPerPage, descending } = pagination.value;

    try {
        const path = await getPath();
        let response = await useChainStore().currentChain.settings.getIndexerApi().get(path);
        totalRows.value = response.data?.total_count;
        const results = response.data.results;

        pagination.value.rowsPerPage = rowsPerPage;
        pagination.value.descending = descending;
        pagination.value.rowsNumber = totalRows.value;

        if (results.length > 0) {
            const firstItemKey = results[0].id;
            pagination.value.initialKey = firstItemKey + 1;
        }

        transactions.splice(0, transactions.length, ...results);
        rows.value = transactions;

        for (const transaction of transactions) {
            try {
                if (transaction.input === '0x' || !transaction.to) {
                    continue;
                }
                const contract = await useChainStore().currentChain.settings.getContractManager().getContract(transaction.to);
                if (!contract) {
                    continue;
                }
                const parsedTransaction = await useChainStore().currentChain.settings.getContractManager().parseContractTransaction(
                    transaction, transaction.input, contract, true,
                );
                if (parsedTransaction) {
                    transaction.parsedTransaction = parsedTransaction;
                } else {
                    if (response.data.abi) {
                        const abi = response.data.abi as { [sighash: string]: string };
                        const valueStr: string = transaction.value === '0x0' ? '0' : transaction.value ?? '0';
                        const value = BigNumber.from(valueStr);
                        const sighash = transaction.input.slice(0, 10);
                        const signature = abi[sighash] as string;
                        const name = typeof signature === 'string'
                            ? signature.split('(')[0].replace('function ', '')
                            : sighash;
                        transaction.parsedTransaction = {
                            name,
                            sighash,
                            signature,
                            value,
                        };
                    }
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

async function getPath () {
    const { page, rowsPerPage, descending } = pagination.value;
    const limit = rowsPerPage;
    console.assert(limit > 0, `Rows per page must be greater than 0, got ${limit}`);
    let path = '';

    if (props.accountAddress) {
        path = `v1/address/${props.accountAddress}/transactions?limit=${limit}`;
        path += `&offset=${(page - 1) * rowsPerPage}`;
    } else {
        path = `v1/transactions?limit=${limit}`;
        if (pagination.value.initialKey === 0) {
            // In the case of the first query, get the initial key
            let response = await useChainStore().currentChain.settings.getIndexerApi().get('/v1/transactions?limit=6');
            const next = response.data.results[0].id;
            pagination.value.initialKey = next;
        }
        let currentKey = pagination.value.initialKey - ((page - 1) * rowsPerPage);
        if (currentKey < 0) {
            currentKey = rowsPerPage + 1;
        }
        if (props.block) {
            // The scope will be set by the block property
            currentKey += 1000;
        }
        path += `&key=${currentKey}`;
    }

    path += `&sort=${descending ? 'desc' : 'asc'}`;
    path += '&includePagination=true';
    path += '&includeAbi=true';

    if (props.block) {
        path += `&block=${props.block}`;
    }

    return path;
}

function toggleDateFormat () {
    showDateAge.value = !showDateAge.value;
}

function toggleGasValue () {
    showTotalGasFee.value = !showTotalGasFee.value;
}

function setHighlightMethod (val: string) {
    highlightMethod.value = val;
}

const updateLoadingRows = () => {
    loadingRows.value = [];
    for (let i = 1; i <= pagination.value.rowsPerPage; i++) {
        loadingRows.value.push(i);
    }
    // Adjust loading rows if there are not enough rows to fill the page
    if (
        rows.value.length > 0 &&
        rows.value.length < pagination.value.rowsPerPage &&
        rows.value.length !== loadingRows.value.length
    ) {
        loadingRows.value = [];
        for (let i = 1; i <= pagination.value.rowsPerPage - rows.value.length; i++) {
            loadingRows.value.push(i);
        }
    }
};

watch(() => pagination.value.rowsPerPage, () => {
    updateLoadingRows();
});

watch(() => route.query.tab, (newTab) => {
    if (newTab === 'transactions') {
        writePaginationToURL(pagination.value.page, pagination.value.rowsPerPage, props.initialPageSize, routers);
    }
});

onBeforeMount(() => {
    updateLoadingRows();
});

function readPaginationFromURLAndDoRequest() {
    if (route.query.tab === 'transactions' || !route.query.tab || route.path === '/txs') {
        // Read pagination state from URL
        const { page, rowsPerPage } = readPaginationFromURL(props.initialPageSize, routers);
        // Update pagination state; ignore sort since it never changes
        setPagination(page, rowsPerPage);
    } else {
        // Reset pagination state
        setPagination(1, props.initialPageSize);
    }
}

onMounted(() => {
    readPaginationFromURLAndDoRequest();
});


// Watch for changes in the route query 'page' and update data accordingly
watch(
    () => route.query,
    () => {
        if (route.path === '/txs') {
            readPaginationFromURLAndDoRequest();
        }
    },
    { immediate: true, deep: true },
);

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
        :hide-bottom="true"
    >
        <template v-slot:no-data>
            <EmptyTableSign />
        </template>
        <template v-slot:header="props">
            <!-- Table pagination buttons in header -->
            <q-tr>
                <q-td :colspan="columns.length">
                    <TablePagination
                        position="top"
                        :pageOptions="page_size_options"
                        :table="table"
                        :entryName="entryName"
                        :pagination="pagination"
                        @update="onPaginationChange"
                    />
                </q-td>
            </q-tr>
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
                        :symbol="useChainStore().currentChain.settings.getSystemToken().symbol"
                        :decimals="useChainStore().currentChain.settings.getSystemToken().decimals"
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
        <!-- Bottom row with table pagination buttons -->
        <template v-slot:bottom-row>
            <q-tr>
                <q-td :colspan="columns.length" class="pagination-container">
                    <TablePagination
                        position="bottom"
                        :pageOptions="page_size_options"
                        :table="table"
                        :entryName="entryName"
                        :pagination="pagination"
                        @update="onPaginationChange"
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
        :hide-bottom="true"
    >
        <template v-slot:header="props">
            <!-- Table pagination buttons in header -->
            <q-tr>
                <q-td :colspan="columns.length">
                    <TablePagination
                        position="top"
                        :pageOptions="page_size_options"
                        :table="table"
                        :entryName="entryName"
                        :pagination="pagination"
                        @update="onPaginationChange"
                    />
                </q-td>
            </q-tr>
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
                <q-td
                    v-for="col in columns"
                    :key="col.name"
                    class="c-transaction-table__cell"
                >
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
            </q-tr>
        </template>
        <!-- Bottom row with table pagination buttons -->
        <template v-slot:bottom-row>
            <q-tr>
                <q-td :colspan="columns.length" class="pagination-container">
                    <TablePagination
                        position="bottom"
                        :pageOptions="page_size_options"
                        :table="table"
                        :entryName="entryName"
                        :pagination="pagination"
                        @update="onPaginationChange"
                    />
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
        padding: 7px 9px !important;
    }
}
</style>


