<!-- eslint-disable no-case-declarations -->
<script lang="ts" setup>
import {
    onMounted,
    ref,
    watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

import TransactionField from 'components/TransactionField.vue';
import ValueField from 'components/ValueField.vue';
import MethodField from 'components/MethodField.vue';
import AddressField from 'components/AddressField.vue';
import NftItemField from 'components/NftItemField.vue';
import DateField from 'components/DateField.vue';
import EmptyTableSign from 'components/EmptyTableSign.vue';
import TablePagination from 'src/components/TablePagination.vue';

import {
    formatWei,
    toChecksumAddress,
} from 'src/lib/utils';
import {
    NftTransferProps,
    NftTransferData,
    PaginationByKey,
} from 'src/types';

import {
    loadTransaction,
    getDirection,
} from 'src/lib/transaction-utils';
import { useStore } from 'vuex';
import { useChainStore } from 'src/core';
import {
    useRoute,
    useRouter,
} from 'vue-router';
import { readPaginationFromURL, writePaginationToURL } from 'src/lib/pagination';

// Import router and i18n utilities
const route = useRoute();
const router = useRouter();
const routers = {
    router,
    route,
};
const { t: $t } = useI18n();
const $store = useStore();
const toggleDisplayDecimals = () => $store.dispatch('general/toggleDisplayDecimals');

// ---------------------
interface TransfersResponse {
    code: number;
    success: boolean;
    total_count: number;
    more: boolean;
    message: string;
    contracts: { [address: string]: ContractData };
    results: TransferData[];
}

interface ContractData {
    symbol?: string;
    creator?: string;
    address: string;
    fromTrace?: boolean;
    trace_address?: string;
    supply?: string;
    calldata?: string;
    block_timestamp?: number;
    decimals?: number | null;
    name?: string;
    block?: number;
    supportedInterfaces?: string[];
    transaction?: string;
}

interface TransferData {
    amount: string; // amount of tokens
    logIndex: number;
    contract: string;
    blockNumber: number;
    from: string;
    id: string;
    to: string;
    type: string;
    transaction: string;
    timestamp: string;
}

// ---------------------

const props = withDefaults(defineProps<NftTransferProps>(), {
    title: '',
    tokenType: '',
    address: '',
    initialPageSize: 10,
});

const rows = ref<Array<NftTransferData>>([]);
const loading = ref(false);
const loadingRows = ref<Array<number>>([]);
const loadingCols = ref<Array<number>>([]);
const showDateAge = ref(true);
const highlightMethod = ref('');

const pagination = ref<PaginationByKey>({
    key: 0,
    page: 1,
    descending: true,
    rowsPerPage: props.initialPageSize,
    rowsNumber: 0,
    initialKey: 0,
});
const table = props.tokenType;
const entryName = $t('components.table_pagination.transfers');
const page_size_options = [10, 25, 50];

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
        label: $t('components.to'),
        align: 'left',
    },
    {
        name: 'id',
        label: $t('components.nfts.id'),
        align: 'left',
    },
    {
        name: 'value',
        label: $t('components.value'),
        align: 'left',
    },
    {
        name: 'amount',
        label: $t('components.amount'),
        align: 'left',
    },
    {
        name: 'token',
        label: $t('components.token'),
        align: 'left',
    },
    {
        name: 'item',
        label: $t('components.item'),
        align: 'left',
    },
] as {
    name: string,
    label: string,
    align: string,
}[];


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

// Method to handle pagination changes from the UI
async function onPaginationChange(settings: { pagination: PaginationByKey }) {
    const { page, rowsPerPage, descending } = settings.pagination;
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.descending = descending;

    // Write pagination state to URL using the library function
    writePaginationToURL(page, rowsPerPage, props.initialPageSize, routers);

    await onRequest();
}

function setHighlightMethod(val: string) {
    highlightMethod.value = val;
}

const truncatedId = (id: string) => {
    if (id.length > 7) {
        return `${id.substring(0, 4)}...${id.substring(id.length - 3)}`;
    } else {
        return id;
    }
};

const getPath = () => {
    const { page, rowsPerPage, descending } = pagination.value;
    let path = `/v1/account/${props.address}/transfers?limit=${
        rowsPerPage === 0 ? 10 : rowsPerPage
    }`;
    path += `&type=${props.tokenType}`;
    path += `&offset=${(page - 1) * rowsPerPage}&includePagination=true`;
    path += `&sort=${descending ? 'desc' : 'asc'}`;

    return path;
};

const resolveMethodName = async (transfer: NftTransferData) => {
    transfer.trx = await loadTransaction(transfer.hash);
    // force the rows to update
    rows.value = [...rows.value];
};

const onRequest = async () => {
    const indexerApi = useChainStore().currentChain.settings.getIndexerApi();

    loading.value = true;
    const path = getPath();
    let response = await indexerApi.get(path) as { data: TransfersResponse };
    if (!pagination.value.rowsNumber && response.data?.total_count) {
        pagination.value.rowsNumber = response.data.total_count;
    }

    updateLoadingRows();

    let newTransfers = [] as NftTransferData[];
    for (const transfer of response.data.results) {
        const contractData = response.data.contracts[transfer.contract];
        let valueDisplay;
        if(props.tokenType === 'erc20'){
            if (contractData && contractData.decimals) {
                valueDisplay = formatWei(transfer.amount, contractData.decimals);
            } else {
                valueDisplay = $t('components.unknown_precision');
            }
        }

        const nTransfer = {
            hash: transfer.transaction,
            timestamp: new Date(transfer.timestamp).getTime(),
            amount: transfer.amount,
            id: transfer.id,
            value: valueDisplay,
            contract: contractData,
            from: toChecksumAddress(transfer.from),
            to: toChecksumAddress(transfer.to),
            trx: null,
        } as NftTransferData;

        newTransfers.push(nTransfer);
        resolveMethodName(nTransfer);
    }

    rows.value.splice(
        0,
        rows.value.length,
        ...newTransfers,
    );
    loading.value = false;
};

const convertToEpoch = (dateString: string | number) => {
    if (typeof dateString === 'number'){
        return dateString / 1000;
    }
    const d: number[] = dateString.split(/\D+/).map(n => parseInt(n, 10));
    const epoch = new Date(d[0], --d[1], d[1], d[3], d[4], d[5]).getTime() / 1000;
    return epoch;
};

function toggleDateFormat() {
    showDateAge.value = !showDateAge.value;
}

const updateLoadingRows = () => {
    loadingRows.value = [];
    for (var i = 1; i <= pagination.value.rowsPerPage; i++) {
        loadingRows.value.push(i);
    }
};

const updateColumns = () => {
    let exclude = [] as string[];

    switch (props.tokenType) {
    case 'erc20':
        exclude = ['id', 'amount', 'item'];
        break;
    case 'erc721':
        exclude = ['value', 'amount', 'token'];
        break;
    case 'erc1155':
        exclude = ['value', 'token'];
        break;
    default:
        throw new Error($t('components.unsupported_token_type', { tokenType: props.tokenType }));
    }

    const filtered = columns.filter(col => !exclude.includes(col.name));
    columns.splice(
        0,
        columns.length,
        ...filtered,
    );
    loadingCols.value = [];
    for (var i = 1; i <= columns.length; i++) {
        loadingCols.value.push(i);
    }
};

watch(() => columns, () => {
    updateColumns();
});

watch(() => pagination.value.rowsPerPage, () => {
    updateLoadingRows();
});

watch(() => props.tokenType, () => {
    updateColumns();
    updateLoadingRows();
},
{ immediate: true });

watch(() => route.query.network, () => {
    onRequest();
});

watch(() => route.query.tab, (newTab) => {
    const doWrite =
        newTab === 'tokentxns' && props.tokenType === 'erc20' ||
        newTab === 'erc721txns' && props.tokenType === 'erc721' ||
        newTab === 'erc1155txns' && props.tokenType === 'erc1155';
    if (doWrite) {
        writePaginationToURL(pagination.value.page, pagination.value.rowsPerPage, props.initialPageSize, routers);
    }
});

onMounted(() => {
    updateColumns();
    updateLoadingRows();
    const tab = route.query.tab;
    const doWrite =
        tab === 'tokentxns' && props.tokenType === 'erc20' ||
        tab === 'erc721txns' && props.tokenType === 'erc721' ||
        tab === 'erc1155txns' && props.tokenType === 'erc1155';
    if (doWrite) {
        // Read pagination state from URL
        const { page, rowsPerPage } = readPaginationFromURL(props.initialPageSize, routers);
        // Update pagination state; ignore sort since it never changes
        setPagination(page, rowsPerPage);
    } else {
        // load page 1
        onRequest();
    }
});

</script>

<template>
<q-table
    v-if="!loading"
    v-model:pagination="pagination"
    :rows="rows"
    :row-key="row => row.hash"
    :columns="(columns as any)"
    :rows-per-page-label="$t('global.records_per_page')"
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
            >
                <div
                    v-if="col.name==='date'"
                    class="u-flex--center-y"
                    @click="toggleDateFormat"
                >
                    <a>{{ showDateAge ? col.label: $t('components.date') }}</a>

                    <q-icon class="info-icon" name="far fa-question-circle" />
                    <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                        {{ $t('components.click_to_change_format') }}
                    </q-tooltip>
                </div>
                <div
                    v-else-if="col.name==='value'"
                    class="u-flex--center-y"
                    @click="toggleDisplayDecimals"
                >
                    <a>{{ col.label }}</a>
                    <q-icon class="info-icon q-ml-xs" name="far fa-question-circle"/>
                    <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                        {{ $t('components.click_to_change_format') }}
                    </q-tooltip>
                </div>
                <div v-else class="u-flex--center-y">
                    {{ col.label }}
                </div>

            </q-th>
        </q-tr>
    </template>

    <template v-slot:body="props">
        <q-tr :props="props">
            <q-td key="hash" :props="props">
                <TransactionField
                    :transaction-hash="props.row.hash"
                />
            </q-td>
            <q-td key="method" :props="props">
                <MethodField
                    v-if="props.row.trx"
                    :trx="props.row.trx"
                    :shortenName="true"
                    :highlightMethod="highlightMethod"
                    @highlight="setHighlightMethod"
                />
                <q-skeleton v-else type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="date" :props="props">
                <DateField :epoch="convertToEpoch(props.row.timestamp)" :force-show-age="showDateAge"/>
            </q-td>
            <q-td key="direction" :props="props">
                <span
                    :class="`direction ${getDirection(address, props.row)}`"
                >
                    {{ $t(`components.transaction.${getDirection(address, props.row)}`).toUpperCase() }}
                </span>
            </q-td>
            <q-td key="from" :props="props">
                <AddressField
                    v-if="props.row.from"
                    :key="props.row.from"
                    :address="props.row.from"
                    :truncate="12"
                />
            </q-td>
            <q-td key="to" :props="props">
                <AddressField
                    v-if="props.row.to"
                    :key="props.row.to"
                    :address="props.row.to"
                    :truncate="12"
                />
            </q-td>
            <q-td key="id" :props="props">
                <span class="q-pl-xs" >
                    #{{ truncatedId(props.row.id) }}
                    <q-tooltip>{{ props.row.id }}</q-tooltip>
                </span>
            </q-td>
            <q-td key="amount" :props="props">
                <span>
                    {{ truncatedId(props.row.amount) }}
                    <q-tooltip>{{ props.row.amount }}</q-tooltip>
                </span>
            </q-td>
            <q-td key="value" :props="props">
                <ValueField
                    :value="props.row.value"
                    :symbol="props.row.contract.symbol"
                    :decimals="props.row.contract.decimals"
                />
            </q-td>
            <q-td key="token" :props="props" class="flex items-center">
                <AddressField
                    :key="props.row.contract.address"
                    :address="props.row.contract.address"
                    :truncate="16"
                />
            </q-td>
            <q-td key="item" :props="props" class="flex items-center">
                <NftItemField
                    :id="props.row.id"
                    :contract="props.row.contract"
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
    :row-key="row => row.hash"
    :columns="(columns as any)"
    :rows-per-page-label="$t('global.records_per_page')"
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
            >
                <div
                    v-if="col.name==='date'"
                    class="u-flex--center-y"
                    @click="toggleDateFormat"
                >
                    <a>{{ showDateAge ? col.label: $t('components.date') }}</a>

                    <q-icon class="info-icon" name="far fa-question-circle" />
                    <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                        {{ $t('components.click_to_change_format') }}
                    </q-tooltip>
                </div>
                <div v-else class="u-flex--center-y">
                    {{ col.label }}
                </div>

            </q-th>
        </q-tr>
    </template>

    <template v-slot:body="">
        <q-tr>
            <q-td v-for="col in loadingCols" :key="col">
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
</template>

<style lang='scss' scoped>
.direction {
  @include direction;
}

.nft-icon {
  width: 32px;
  height: 32px;
  vertical-align: middle;
  border-radius: 100%;
}

.coin-icon {
  width: 20px;
  height: 20px;
  margin-right: .25rem;
  vertical-align: middle;
  border-radius: 100%;
}

.token-name {
  vertical-align: middle;
  display: inline-block;
}

.info-icon{
    margin-left: .25rem;
}

.value {
    max-width: 175px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
}

</style>
