<script lang='ts' setup>
import { ref, computed, onMounted, watch, withDefaults, defineProps } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BlockField from 'src/components/BlockField.vue';
import DateField from 'src/components/DateField.vue';
import TransactionField from 'src/components/TransactionField.vue';
import AddressField from 'src/components/AddressField.vue';
import ValueField from 'src/components/ValueField.vue';
import EmptyTableSign from 'src/components/EmptyTableSign.vue';
import TablePagination from 'src/components/TablePagination.vue';
import { getDirection as importedGetDirection } from 'src/lib/transaction-utils';
import { useChainStore } from 'src/core';
import {
    PaginationByKey,
} from 'src/types';
import { readPaginationFromURL, writePaginationToURL } from 'src/lib/pagination';

// Define interfaces
interface Column {
    name: string;
    label: string;
    align: string;
}

interface TransactionRow {
    trx: 'even' | 'odd';
    hash: string;
    blockNumber: number;
    timestamp: number;
    type: string;
    from: string;
    to: string;
    value: number | string;
    symbol: string;
    decimals: number;
}

interface ResponseRow {
    transactionHash: string;
    blockNumber: number;
    timestamp: number;
    action: {
        callType: string;
        from: string;
        to: string;
        value: number | string;
    };
}

interface Props {
    address: string;
    page?: number;
    filter?: Record<string, string>;
    initialPageSize?: number;
    usePagination?: boolean;
}

// Define props with defaults
const props = withDefaults(defineProps<Props>(), {
    filter: () => ({}),
    initialPageSize: 25,
    usePagination: true,
});

// Import router and i18n utilities
const route = useRoute();
const router = useRouter();
const routers = {
    router,
    route,
};
const { t: $t } = useI18n();

// Define reactive state variables
const rows = ref<TransactionRow[]>([]);
const loadingRows = ref<number[]>([]);
const columns = ref<Column[]>([
    {
        name: 'hash',
        label: 'hash',
        align: 'left',
    },
    {
        name: 'block',
        label: 'block',
        align: 'left',
    },
    {
        name: 'date',
        label: 'date',
        align: 'left',
    },
    {
        name: 'type',
        label: 'type',
        align: 'left',
    },
    {
        name: 'from',
        label: 'from',
        align: 'left',
    },
    {
        name: 'direction',
        label: 'direction',
        align: 'left',
    },
    {
        name: 'to',
        label: 'to',
        align: 'left',
    },
    {
        name: 'value',
        label: 'value',
        align: 'right',
    },
]);
const loading = ref(true);
const pagination = ref<PaginationByKey>({
    key: 0,
    page: 1,
    descending: true,
    rowsPerPage: props.initialPageSize,
    rowsNumber: 0,
    initialKey: 0,
});
const table = 'internal';
const entryName = $t('components.table_pagination.transactions');
const page_size_options = [10, 25, 50];
const showDateAge = ref(true);

// Computed property: if loading, show loading rows; otherwise, show actual rows
const rowsToShow = computed(() => loading.value ? loadingRows.value : rows.value);

// Expose imported getDirection function for template use
const getDirection = importedGetDirection;

// Lifecycle hook: on component mount
onMounted(() => {
    // Initialize translated texts for columns
    columns.value.filter(t => t.name === 'hash')[0].label = $t('components.tx_hash');
    columns.value.filter(t => t.name === 'block')[0].label = $t('components.block');
    columns.value.filter(t => t.name === 'date')[0].label = $t('components.age');
    columns.value.filter(t => t.name === 'type')[0].label = $t('components.approvals.type');
    columns.value.filter(t => t.name === 'from')[0].label = $t('pages.from');
    columns.value.filter(t => t.name === 'to')[0].label = $t('pages.to');
    columns.value.filter(t => t.name === 'value')[0].label = $t('pages.value');
    columns.value.filter(t => t.name === 'direction')[0].label = $t('components.direction');

    // If pagination is disabled, set rowsPerPage to initialPageSize
    if (!props.usePagination) {
        pagination.value.rowsPerPage = props.initialPageSize;
    }
    updateLoadingRows();
});

// Watch for changes in the route query 'page' and update data accordingly
watch(
    () => route.query,
    () => {
        const { page, rowsPerPage } = readPaginationFromURL(props.initialPageSize, { router, route });
        setPagination(page, rowsPerPage);
    },
    { immediate: true, deep: true },
);

// Watch for changes in the address prop to clear pagination
watch(
    () => props.address,
    () => {
        clearPagination();
    },
);

// Method to clear the pagination state
function clearPagination(): void {
    pagination.value.page = 1;
    pagination.value.rowsPerPage = props.initialPageSize;
    pagination.value.rowsNumber = 0;
}

// Method to update the loading rows based on the current rowsPerPage
function updateLoadingRows(): void {
    loadingRows.value = [];
    for (let i = 1; i <= pagination.value.rowsPerPage; i++) {
        loadingRows.value.push(i);
    }
}

// Method to set the pagination state and request new data
function setPagination(page: number, size: number): void {
    if (page) {
        pagination.value.page = Number(page);
    }
    if (props.usePagination) {
        if (size) {
            pagination.value.rowsPerPage = Number(size);
        }
    } else {
        pagination.value.rowsPerPage = props.initialPageSize;
    }
    updateLoadingRows();
    onRequest();
}

// Method to handle pagination changes from the UI
async function onPaginationChange (settings: { pagination: PaginationByKey }) {
    const { page, rowsPerPage, descending } = settings.pagination;
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.descending = descending;

    // Write pagination state to URL using the library function
    writePaginationToURL(page, rowsPerPage, props.initialPageSize, routers);

    await onRequest();
}

// Method to fetch data from the API based on current pagination and filters
async function onRequest(): Promise<void> {
    const chainStore = useChainStore();
    const chainSettings = chainStore.currentChain.settings;
    loading.value = true;
    rows.value = [];
    const { page, rowsPerPage, descending } = pagination.value;
    const path = getPath();
    const indexerApi = chainSettings.getIndexerApi();
    const result = await indexerApi.get(path);
    if (!pagination.value.rowsNumber) {
        pagination.value.rowsNumber = result.data.total_count;
    }
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.descending = descending;

    // Process the result data and build table rows
    let processedTransactions = 0;
    let lastTransactionHash = '';
    const totalEntries: TransactionRow[] = [];
    result.data.results.forEach((internalTrx: ResponseRow) => {
        if (internalTrx.transactionHash !== lastTransactionHash) {
            processedTransactions++;
            lastTransactionHash = internalTrx.transactionHash;
        }
        const entry: TransactionRow = {
            trx: processedTransactions % 2 === 0 ? 'even' : 'odd',
            hash: internalTrx.transactionHash,
            blockNumber: internalTrx.blockNumber,
            timestamp: internalTrx.timestamp,
            type: internalTrx.action.callType,
            from: internalTrx.action.from,
            to: internalTrx.action.to,
            value: internalTrx.action.value,
            symbol: chainSettings.getSystemToken().symbol,
            decimals: chainSettings.getSystemToken().decimals,
        };
        totalEntries.push(entry);
    });
    rows.value = totalEntries;
    loading.value = false;
}

// Method to construct the API path based on pagination and filters
function getPath(): string {
    const { page, rowsPerPage, descending } = pagination.value;
    let path = '';
    const limit = Math.max(rowsPerPage, page_size_options[0]);
    console.assert(limit > 0, `Rows per page must be greater than 0, got ${limit}`);
    const filter = props.filter ? { ...props.filter } : {};
    if (props.address) {
        path = `v1/address/${props.address}/internal?limit=${limit}`;
    } else {
        path = `v1/internal?limit=${limit}`;
    }
    if (filter.block) {
        path += `&block=${filter.block}`;
    }
    if (filter.hash) {
        path += `&hash=${filter.hash}`;
    }
    path += `&offset=${(page - 1) * rowsPerPage}`;
    path += `&sort=${descending ? 'desc' : 'asc'}`;
    path += '&includeAbi=1&full=1';
    path += (!pagination.value.rowsNumber) ? '&includePagination=true' : '';
    return path;
}

// Method to toggle the date format display
function toggleDateFormat(): void {
    showDateAge.value = !showDateAge.value;
}

</script>


<template>
<q-table
    v-model:pagination="pagination"
    class="c-inttrx-flat__table"
    :rows="rowsToShow"
    :row-key="row => row.hash"
    :columns="(columns as any)"
    :rows-per-page-options="page_size_options"
    :hide-bottom="usePagination"
>
    <template v-slot:no-data>
        <EmptyTableSign />
    </template>
    <template v-if="!usePagination" v-slot:bottom>
        <q-card-actions
            align="center"
            class="c-inttrx-flat__footer"
        >
            <router-link class="c-inttrx-flat__footer-container" :to="{ name: 'txsinternal', query: { a: address } }">
                <span class="c-inttrx-flat__footer-text"> {{ $t('pages.transactions.see_all_transactions') }} </span>
                <q-icon name="arrow_forward" class="c-inttrx-flat__footer-icon" />
            </router-link>
        </q-card-actions>
    </template>
    <template v-slot:header="props">
        <!-- Table pagination buttons in header -->
        <q-tr v-if="usePagination">
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
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <template v-if="col.name === 'date'" >
                    <div class="c-inttrx-flat__header-age u-flex--center-y" @click="toggleDateFormat">
                        <a>{{ showDateAge ? col.label: $t('components.date') }}</a>
                        <q-icon class="info-icon" name="far fa-question-circle" />
                        <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </div>
                </template>
                <div v-else>
                    {{ col.label }}
                </div>
            </q-th>
        </q-tr>
    </template>
    <template v-slot:body="props">
        <template v-if="loading">
            <q-tr>
                <q-td
                    v-for="i in (8)"
                    :key="i"
                >
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
            </q-tr>
        </template>
        <template v-else>
            <q-tr :props="props" :class="props.row.trx">
                <q-td key="hash" :props="props">
                    <TransactionField :transaction-hash="props.row.hash" :useHighlight="true"/>
                </q-td>
                <q-td key="block" :props="props">
                    <BlockField :block="props.row.blockNumber"/>
                </q-td>
                <q-td key="date" :props="props">
                    <DateField :epoch="props.row.timestamp / 1000" :force-show-age="showDateAge"/>
                </q-td>
                <q-td key="type" :props="props">
                    {{ props.row.type }}
                </q-td>
                <q-td key="from" :props="props">
                    <AddressField
                        v-if="props.row.from"
                        :key="props.row.from"
                        :address="props.row.from"
                        :truncate="12"
                    />
                </q-td>
                <q-td key="direction" :props="props">
                    <span
                        :class="`direction ${getDirection(address, props.row)}`"
                    >
                        {{ $t(`components.transaction.${getDirection(address, props.row)}`).toUpperCase() }}
                    </span>
                </q-td>
                <q-td key="to" :props="props">
                    <AddressField
                        v-if="props.row.to"
                        :key="props.row.to"
                        :address="props.row.to"
                        :truncate="12"
                    />
                </q-td>
                <q-td key="value" :props="props">
                    <ValueField
                        :value="props.row.value"
                        :symbol="props.row.symbol"
                        :decimals="props.row.decimals"
                    />
                </q-td>
            </q-tr>
        </template>
    </template>
    <!-- Bottom row with table pagination buttons -->
    <template v-if="usePagination" v-slot:bottom-row>
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
</template>
<style lang="scss">

.odd {
    background-color: var(--odd-row-bg-color);
}

.direction {
  @include direction;
}

.c-inttrx-flat {
    .info-icon{
        margin-left: .25rem;
        padding-bottom: 0.2rem;
    }



    &__table {
        .q-table__bottom {
            position: relative;
        }
    }
    &__header-age {
        gap: 5px;
    }
    &__footer {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        top: 0;
        cursor: pointer;
        display: flex;
        gap: 5px;
        background-color: color-mix(in srgb, white, black 5%);

        &-container {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
        }

        body.body--dark & {
            background-color: color-mix(in srgb, $dark, white 5%);
        }

        &-text {
            font-size: 0.7rem;
            text-transform: uppercase;
        }
        &:hover {
            color: var(--q-primary);
        }
    }

}


</style>
