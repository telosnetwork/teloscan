<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<!-- src/components/Token/HolderList.vue -->
<script lang="ts" setup>
// We import the needed libraries
import { ref, computed, onBeforeMount, onMounted, Ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AddressField from 'components/AddressField.vue';
import MinimumVersionRequired from 'components/MinimumVersionRequired.vue';
import TablePagination from 'src/components/Token/TablePagination.vue';
import BigDecimal from 'js-big-decimal';
import { BigNumber, ethers } from 'ethers';
import { INDEXER_SUPPORT_TIME_OUT, useChainStore } from 'src/core';
import {
    EvmHolder,
    IndexerHoldersResponse,
    NativeCurrencyAddress,
    ContractDisplayInfo,
} from 'src/core/types';
import {
    pagination,            // Reactive pagination object. Represents current pagination state
    default_rows_per_page_options,
    setPaginationTotalNumber,
} from 'src/lib/pagination';

defineOptions({
    name: 'HolderList',
});

// Default decimals
const DEFAULT_DECIMALS = 18;

// Default columns if user does not provide any
const defaultColumns = ['rank', 'holder', 'balance', 'percentage_bar'];

type Alignment = 'left' | 'center' | 'right';

interface ContractProps {
    address: string
    properties?: {
        decimals?: number
        supply?: string
        total_supply_ibc?: string
        symbol?: string
        price?: string
    }
}

interface TableColumn {
    name: string
    label: string
    align: Alignment
    field: string
    sortable?: boolean
}

// We define the props, including a new 'columns' array
const props = withDefaults(
    defineProps<{
            contract?: ContractProps
            columns?: string[]
        }>(),
    {},
);

// Access i18n
const { t: $t, locale } = useI18n();

// We will keep track of the system token from chain settings
const systemToken = computed(() => useChainStore().currentChain.settings.getSystemToken());

// We define a reference for system token contract
const systemTokenContract = ref<ContractProps>({
    address: systemToken.value.contract,
    properties: {
        decimals: systemToken.value.decimals || DEFAULT_DECIMALS,
        supply: '0',
        total_supply_ibc: '0',
        symbol: systemToken.value.symbol,
    },
} as ContractProps);

// Our contract data
const contract: Ref<ContractProps> = ref<ContractProps>(
    props.contract
        ? props.contract
        : {
            address: NativeCurrencyAddress,
            properties: {
                decimals: DEFAULT_DECIMALS,
                supply: '0',
                total_supply_ibc: '0',
                symbol: '',
                price: '',
            },
        },
);

// Minimum version for the indexer
const minimumVersion = '1.2.9';

// Reactive references
const weHaveIndexerSupport = ref(false);
const holders = ref<EvmHolder[]>([]);
const loadingRows = ref<number[]>([]);
const loading = ref(true);
const systemContractsList = ref('');
const showSystemContracts = ref(false);


// Chain settings
const chainSettings = computed(() => useChainStore().currentChain.settings);

// Decide which columns to show (either user-provided or default)
const visibleColumns = computed(() => {
    if (!props.columns || props.columns.length === 0) {
        return defaultColumns;
    }
    return props.columns;
});

// Dictionary that maps each column name to a Quasar TableColumn
const columnsDict: Record<string, TableColumn> = {
    rank: {
        name: 'rank',
        field: 'rank',
        label: 'Rank',
        align: 'left',
    },
    holder: {
        name: 'holder',
        field: 'holder',
        label: $t('components.holders.holder'),
        align: 'left',
    },
    address: {
        name: 'address',
        field: 'address',
        label: 'Address',
        align: 'left',
    },
    tag_name: {
        name: 'tag_name',
        field: 'tag_name',
        label: 'Contract Name',
        align: 'left',
    },
    balance: {
        name: 'balance',
        field: 'balance',
        label: 'Balance',
        align: 'left',
    },
    quantity: {
        name: 'quantity',
        field: 'quantity',
        label: 'Quantity',
        align: 'left',
    },
    percentage: {
        name: 'percentage',
        field: 'percentage',
        label: 'percentage',
        align: 'left',
    },
    percentage_bar: {
        name: 'percentage_bar',
        field: 'percentage_bar',
        label: 'percentage',
        align: 'left',
    },
    txn_count: {
        name: 'txn_count',
        field: 'txn_count',
        label: 'Txn Count',
        align: 'left',
    },
    value: {
        name: 'value',
        field: 'value',
        label: 'Value (USD)',
        align: 'left',
    },
};

// This computed array transforms the visibleColumns into an array of Quasar columns
const tableColumns = computed<TableColumn[]>(() =>
    visibleColumns.value.map((colName) => {
        if (columnsDict[colName]) {
            return columnsDict[colName];
        }
        // Fallback if the user passes a column not in the dictionary
        return {
            name: colName,
            field: colName,
            label: colName,
            align: 'left',
        };
    }),
);

// Prepare skeleton rows (loading placeholders)
const updateLoadingRows = () => {
    loadingRows.value = [];
    for (let i = 1; i <= pagination.value.rowsPerPage; i++) {
        loadingRows.value.push(i);
    }
};

onBeforeMount(() => {
    updateLoadingRows();
});

let timer = setTimeout(() => { /**/ }, 0);

onMounted(async () => {
    // Build a list of system contracts
    const list = await chainSettings.value.getContractManager().getSystemContractsList();
    for (const c in list.contracts) {
        systemContractsList.value += list.contracts[c].address + ',';
    }
    // Remove trailing comma
    if (systemContractsList.value.endsWith(',')) {
        systemContractsList.value = systemContractsList.value.slice(0, -1);
    }

    // Remove the value column if no price is provided
    if (!contract.value.properties?.price) {
        const index = tableColumns.value.findIndex(col => col.name === 'value');
        if (index !== -1) {
            tableColumns.value.splice(index, 1);
        }
    }

    // Check indexer support
    weHaveIndexerSupport.value = chainSettings.value.hasIndexerSupportOver(minimumVersion);

    if (!weHaveIndexerSupport.value) {
        timer = setTimeout(() => {
            weHaveIndexerSupport.value = false;
            loading.value = false;
        }, INDEXER_SUPPORT_TIME_OUT);
    }

    // Listen for indexer readiness
    chainSettings.value.indexerReady$.subscribe(() => {
        weHaveIndexerSupport.value = chainSettings.value.hasIndexerSupportOver(minimumVersion);
        clearTimeout(timer);
        onRequest();
    });

    // Retrieve total supply from chain for system token
    chainSettings.value.getTelosApi().get('supply/total').then((res) => {
        if (systemTokenContract.value.properties) {
            const supplyNum = Number(res.data).toFixed(systemToken.value.decimals);
            // Turn it into a string with no decimal point
            const supply = supplyNum.split('.').join('');
            systemTokenContract.value.properties.supply = supply;

            // If no contract is provided, assume it's native
            if (!props.contract && contract.value.properties) {
                contract.value.properties.total_supply_ibc = supply;
                contract.value.properties.supply = supply;
            }
        }
    });
});

// Internal pagination model
const pagination_model = {
    sortBy: 'balance',
    descending: true,
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0,
};

// Update URL query if pagination changes
watch(
    () => pagination.value,
    (a) => {
        pagination_model.page = pagination.value.page;
        pagination_model.rowsPerPage = pagination.value.rowsPerPage;
        pagination_model.rowsNumber = pagination.value.rowsNumber || 0;
        onRequest();
    },
    { deep: true },
);
// Our method for requesting the data
const last = {
    path: '',
};
async function onRequest() {
    if (!weHaveIndexerSupport.value) {
        return;
    }

    const indexerApi = chainSettings.value.getIndexerApi();

    const new_path = getPath();
    if (new_path === last.path) {
        return;
    } else {
        last.path = new_path;
    }

    // Prepare skeleton rows
    updateLoadingRows();
    loading.value = true;

    const response = await indexerApi.get(new_path) as { data?: IndexerHoldersResponse };
    if (response.data?.total_count && pagination_model.rowsNumber !== response.data?.total_count) {
        pagination_model.rowsNumber = response.data.total_count;
        setPaginationTotalNumber(pagination_model.rowsNumber);
    }

    // Calculate the starting rank based on current page and rowsPerPage
    const startRank = (pagination.value.page - 1) * pagination.value.rowsPerPage;

    const resultHolders: EvmHolder[] = [];
    let i = 0;
    for (const entry of response.data?.results || []) {
        // Compute a consecutive rank
        const rank = startRank + i + 1;

        const holder: EvmHolder = {
            rank,
            txn_count: 0,
            ...(entry as Partial<EvmHolder>),
        } as EvmHolder;
        resultHolders.push(holder);

        i++;
    }

    holders.value = resultHolders;
    loading.value = false;
}


// Build the URL path for the request
function getPath(): string {
    const { page, rowsPerPage, descending } = pagination.value;
    let basePath = '';

    if (contract.value.address === NativeCurrencyAddress) {
        basePath = '/v1/balances';
    } else {
        basePath = `/v1/token/${contract.value.address}/holders`;
    }

    let path = `${basePath}?limit=${rowsPerPage === 0 ? 10 : rowsPerPage}`;
    path += '&includeAbi=true';
    path += `&offset=${(page - 1) * rowsPerPage}`;
    path += '&includePagination=true';

    if (!showSystemContracts.value) {
        path += `&not=${systemContractsList.value}`;
    }

    path += `&sort=${descending ? 'desc' : 'asc'}`;
    return path;
}

// Utility to display the supply share
function displaySupplyShare(
    _balance: string,
    _supplies: string,
    decimals: number | undefined,
    fixed: number | boolean,
): string {
    const balance = _balance.split('.').join('');
    const supplies = _supplies.split('.').join('');
    let result = '';

    // Check if balance is zero
    if (new BigDecimal(balance).compareTo(new BigDecimal('0')) === 0) {
        return '0%';
    }

    const share = new BigDecimal(balance)
        .divide(new BigDecimal(+supplies > 0 ? supplies : 1), decimals ? decimals : 0)
        .multiply(new BigDecimal('100'));
    const shareFixed = share.round(2);

    if (share.compareTo(new BigDecimal('0.00001')) === -1) {
        result = '< 0.00001%';
    } else if (share.compareTo(new BigDecimal('0.0001')) === -1) {
        result = '< 0.0001%';
    } else if (share.compareTo(new BigDecimal('0.001')) === -1) {
        result = '< 0.001%';
    } else if (share.compareTo(new BigDecimal('0.01')) === -1) {
        result = '< 0.01%';
    } else if (+supplies > 0) {
        if (fixed) {
            result = shareFixed.getValue() + '%';
        } else {
            result = share.getValue() + '%';
        }
    } else {
        result = '--%';
    }

    return result;
}

// Utility to display the quantity
function displayQuantity(balanceString: string, tokenDecimals?: number): string {
    const bn = BigNumber.from(balanceString);
    const formatted = ethers.utils.formatUnits(bn.toString(), tokenDecimals || 0);
    const result = parseFloat(formatted).toLocaleString(locale.value);
    return result;
}

// Function that returns the symbol for the current token or fallback
function getSymbol(): string {
    return contract.value.properties?.symbol
            || systemToken.value.symbol
            || '???';
}

// Function to get contract name if available
function getContractName(holderAddress: string): string {
    const info = chainSettings.value
        .getContractManager()
        .getContractDisplayInfo(holderAddress) as never as ContractDisplayInfo | null;
    return info?.name || '';
}

// Function to truncate an address
function truncateAddress(address: string, chars = 6): string {
    if (address.length <= chars * 2) {
        return address;
    }
    const start = address.slice(0, chars);
    const end = address.slice(-chars);
    return start + '...' + end;
}

// Function to compute the fraction for percentage bar
function computeBarValue(balanceString: string): number {
    // We can attempt to parse a fraction from displaySupplyShare
    // For simplicity, just parse it as a float if possible
    const shareStr = displaySupplyShare(
        balanceString,
        contract.value.properties?.supply || '0',
        contract.value.properties?.decimals || DEFAULT_DECIMALS,
        false,
    );
        // If it starts with '<', assume a very small fraction
    if (shareStr.startsWith('<')) {
        return 0.0001;
    }
    if (shareStr === '--%') {
        return 0;
    }
    // Remove '%' sign
    const numeric = parseFloat(shareStr.replace('%', ''));
    return numeric / 100;
}

function calculateDollarValue(row: EvmHolder): string {
    try {
        const token_price = contract.value.properties?.price || '0.0';
        const token_decimals = contract.value.properties?.decimals || 0;
        const price_decimals = token_price.split('.')[1]?.length || 0;
        const balance = BigNumber.from(row.balance);
        const price = BigNumber.from(token_price.split('.').join(''));
        const value = balance.mul(price).div(BigNumber.from(10).pow(price_decimals));
        const partial_result = ethers.utils.formatUnits(value.toString(), token_decimals);
        const result = '$' + parseFloat(parseFloat(partial_result).toFixed(0))
            .toLocaleString(locale.value);
        return result;
    } catch (e) {
        console.error('HolderList.calculateDollarValue()', e);
        return '--';
    }
}
</script>

<template>
<template v-if="!weHaveIndexerSupport && !loading">
    <MinimumVersionRequired
        class="c-minimum-version-required"
        required="1.2.9"
    />
</template>
<template v-else>
    <div class="c-holder-list">
        <!-- Table with data -->
        <q-table
            v-if="!loading"
            v-model:pagination="pagination_model"
            class="c-holder-list__table"
            :rows="holders"
            :columns="tableColumns"
            :rows-per-page-label="$t('global.records_per_page')"
            :binary-state-sort="true"
            :hide-bottom='true'
            :row-key="row => row.address"
            :rows-per-page-options="default_rows_per_page_options"
        >
            <!-- Table header -->
            <template v-slot:header="props">
                <!-- Table pagination buttons in header -->
                <q-tr>
                    <q-td :colspan="tableColumns.length">
                        <TablePagination/>
                    </q-td>
                </q-tr>
                <q-tr :props="props">
                    <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                        class="c-holder-list__cell"
                    >
                        <div class="u-flex--center-y">
                            {{ col.label }}
                            <!-- Add downward arrow for 'balance' or 'quantity' columns -->
                            <q-icon
                                v-if="col.name === 'balance' || col.name === 'quantity'"
                                name="arrow_downward"
                                size="16px"
                                class="q-ml-xs"
                            />
                        </div>
                    </q-th>
                </q-tr>
            </template>

            <!-- Table body -->
            <template v-slot:body="props">
                <q-tr :props="props">
                    <q-td
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                        class="c-holder-list__cell"
                    >
                        <!-- rank -->
                        <div v-if="col.name === 'rank'" class="c-holder-list__cell-content">
                            {{ props.row.rank }}
                        </div>

                        <!-- holder -->
                        <div v-else-if="col.name === 'holder'" class="c-holder-list__cell-content">
                            <AddressField
                                :key="props.row.address + 'c'"
                                :address="props.row.address"
                                :truncate="DEFAULT_DECIMALS"
                                :useHighlight="false"
                            />
                        </div>

                        <!-- address -->
                        <div v-else-if="col.name === 'address'" class="c-holder-list__cell-content">
                            <router-link
                                :to="{
                                    name: 'address',
                                    params: { address: props.row.address }
                                }"
                            >
                                {{ truncateAddress(props.row.address) }}
                            </router-link>
                        </div>

                        <!-- tag_name -->
                        <div v-else-if="col.name === 'tag_name'" class="c-holder-list__cell-content">
                            {{ getContractName(props.row.address) }}
                        </div>

                        <!-- balance (with symbol) -->
                        <div v-else-if="col.name === 'balance'" class="c-holder-list__cell-content">
                            {{ displayQuantity(props.row.balance, contract.properties?.decimals) }} {{ getSymbol() }}
                        </div>

                        <!-- quantity (just the number) -->
                        <div v-else-if="col.name === 'quantity'" class="c-holder-list__cell-content">
                            {{ displayQuantity(props.row.balance, contract.properties?.decimals) }}
                        </div>

                        <!-- percentage (old telos_supply_share) -->
                        <div v-else-if="col.name === 'percentage'" class="c-holder-list__cell-content">
                            {{ displaySupplyShare(
                                props.row.balance,
                                contract.properties?.supply || '0',
                                contract.properties?.decimals || DEFAULT_DECIMALS,
                                true
                            ) }}
                        </div>

                        <!-- percentage_bar -->
                        <div v-else-if="col.name === 'percentage_bar'" class="c-holder-list__cell-content">
                            <div class="c-holder-list__cell-content-num">
                                {{ displaySupplyShare(
                                    props.row.balance,
                                    contract.properties?.supply || '0',
                                    contract.properties?.decimals || DEFAULT_DECIMALS,
                                    true
                                ) }}
                            </div>
                            <q-linear-progress
                                class="c-holder-list__cell-content-bar"
                                :value="computeBarValue(props.row.balance)"
                                color="primary"
                                track-color="grey-2"
                            />
                        </div>

                        <!-- txn_count -->
                        <div v-else-if="col.name === 'txn_count'">
                            {{ props.row.txn_count }}
                        </div>

                        <!-- value -->
                        <div v-else-if="col.name === 'value'">
                            {{ calculateDollarValue(props.row) }}
                        </div>

                        <!-- fallback if user passes something not handled -->
                        <div v-else>
                            {{ props.row[col.field] }}
                        </div>
                    </q-td>
                </q-tr>
            </template>

            <!-- Bottom row with table pagination buttons -->
            <template v-slot:bottom-row>
                <q-tr>
                    <q-td :colspan="tableColumns.length" class="pagination-container">
                        <TablePagination/>
                    </q-td>
                </q-tr>
            </template>
        </q-table>

        <!-- Table skeleton when loading -->
        <q-table
            v-else
            v-model:pagination="pagination"
            :rows="loadingRows"
            :columns="tableColumns"
            :rows-per-page-label="$t('global.records_per_page')"
            :rows-per-page-options="[10, 25, 50, 100]"
        >
            <template v-slot:header="props">
                <q-tr :props="props">
                    <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                        class="c-holder-list__cell"
                    >
                        <div class="u-flex--center-y">
                            {{ col.label }}
                            <!-- Add downward arrow for 'balance' or 'quantity' columns -->
                            <q-icon
                                v-if="col.name === 'balance' || col.name === 'quantity'"
                                name="arrow_downward"
                                size="16px"
                                class="q-ml-xs"
                            />
                        </div>
                    </q-th>
                </q-tr>
            </template>
            <template v-slot:body="">
                <q-tr>
                    <q-td
                        v-for="col in tableColumns"
                        :key="col.name"
                        class="c-holder-list__cell"
                    >
                        <q-skeleton type="text" class="c-trx-overview__skeleton" />
                    </q-td>
                </q-tr>
            </template>
        </q-table>
    </div>
</template>
</template>

<style lang="scss">
.q-table .q-td.pagination-container {
    padding: 4px 14px;
}

.c-holder-list {
    &__cell {
        padding: 7px 9px !important;
        &-content {
            display: flex;
            align-items: flex-start;
            flex-direction: column;
            &-num {
                font-size: 14px;
                font-weight: 500;
            }
        }
    }
}

.q-table .q-toggle {
    font-size: 12px;
    position: absolute;
    bottom: 4px;
}

.sortable {
    height: 60px;
    display: flex;
    align-items: center;
}

@media only screen and (max-width: 764px) {
    .q-table .q-toggle {
        display: none;
    }
}

.c-minimum-version-required {
    align-self: center;
}
</style>
