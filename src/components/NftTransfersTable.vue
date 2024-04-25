<!-- eslint-disable no-case-declarations -->
<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { indexerApi } from 'src/boot/telosApi';

import TransactionField from 'components/TransactionField.vue';
import ValueField from 'components/ValueField.vue';
import MethodField from 'components/MethodField.vue';
import AddressField from 'components/AddressField.vue';
import NftItemField from 'components/NftItemField.vue';
import DateField from 'components/DateField.vue';
import { formatWei, toChecksumAddress } from 'src/lib/utils';
import { NftTransferProps, NftTransferData } from 'src/types';

import { loadTransaction, getDirection } from 'src/lib/transaction-utils';
import { Pagination } from 'src/types';

const { t: $t } = useI18n();

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

const pagination = ref<Pagination>(
    {
        sortBy: 'number',
        descending: true,
        page: 1,
        rowsPerPage: props.initialPageSize || 10,
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

const highlightAddress = ref('');
function setHighlightAddress(val: string) {
    highlightAddress.value = val;
}

const getPath = (settings: { pagination: Pagination }) => {
    const { page, rowsPerPage, descending } = settings.pagination;
    let path = `/account/${props.address}/transfers?limit=${
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

const onRequest = async (settings: { pagination: Pagination}) => {
    loading.value = true;

    const { page, rowsPerPage, sortBy, descending } = settings.pagination;

    let response = await indexerApi.get(getPath(settings)) as { data: TransfersResponse };
    if (!pagination.value.rowsNumber && response.data?.total_count) {
        pagination.value.rowsNumber = response.data.total_count;
    }

    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.sortBy = sortBy;
    pagination.value.descending = descending;
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

const updateCols = () => {
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
    updateCols();
});

watch(() => pagination.value.rowsPerPage, () => {
    updateLoadingRows();
});

watch(() => props.tokenType, () => {
    updateCols();
    updateLoadingRows();
},
{ immediate: true });

onMounted(() => {
    updateCols();
    updateLoadingRows();
    onRequest({ pagination: pagination.value });
});

</script>

<template>
<q-table
    v-if="!loading"
    v-model:pagination="pagination"
    :rows="rows"
    :row-key="row => row.hash"
    :columns="columns"
    :rows-per-page-label="$t('global.records_per_page')"
    :rows-per-page-options="[10, 20, 50]"
    @request="onRequest"
>
    <template v-slot:header="props">
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

                    <q-icon
                        class="info-icon"
                        name="far fa-question-circle"
                    >
                        <q-tooltip anchor="bottom middle" self="bottom middle">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </q-icon>
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
                    :highlightAddress="highlightAddress"
                    @highlight="setHighlightAddress"
                />
            </q-td>
            <q-td key="to" :props="props">
                <AddressField
                    v-if="props.row.to"
                    :key="props.row.to"
                    :address="props.row.to"
                    :truncate="12"
                    :highlightAddress="highlightAddress"
                    @highlight="setHighlightAddress"
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
                    :highlightAddress="highlightAddress"
                    @highlight="setHighlightAddress"
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
</q-table>
<q-table
    v-else
    v-model:pagination="pagination"
    :rows="loadingRows"
    :row-key="row => row.hash"
    :columns="columns"
    :rows-per-page-label="$t('global.records_per_page')"
    :rows-per-page-options="[10, 20, 50]"
>
    <template v-slot:header="props">
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

                    <q-icon
                        class="info-icon"
                        name="far fa-question-circle"
                    >
                        <q-tooltip anchor="bottom middle" self="bottom middle">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </q-icon>
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
