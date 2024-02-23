<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { indexerApi } from 'src/boot/telosApi';

import TokenValueField from 'components/Token/TokenValueField.vue';
import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import { BlockData } from 'types';
import { ethers } from 'ethers';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { t: $t } = useI18n();

export interface BlockTableProps {
    title: string;
    initialPageSize?: number,
}

const props = withDefaults(defineProps<BlockTableProps>(), {
    title: '',
    initialPageSize: 25,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rows = ref<Array<BlockData>>([]);
const loading = ref(false);
const showDateAge = ref(true);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blocks: BlockData[] = [];
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
        sortBy: 'number',
        descending: true,
        page: 1,
        rowsPerPage: props.initialPageSize || 25,
        rowsNumber: 0,
    },
);

const columns = [
    {
        name: 'block',
        label: $t('components.blocks.block'),
        align: 'left',
    },
    {
        name: 'timestamp',
        label: $t('components.blocks.age'),
        align: 'left',
    },
    {
        name: 'transactionsCount',
        label: $t('components.blocks.transactions'),
        align: 'left',
    },
    {
        name: 'gasUsed',
        label: $t('components.blocks.gas_used'),
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

function setPagination(page: number, size: number, desc: boolean) {
    if (page) {
        pagination.value.page = page;
    }
    if (size) {
        pagination.value.rowsPerPage = size;
    }
    pagination.value.descending = desc;
    parseblocks();
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


// Esta función va intentar primero retornar el valor cacheado en el local storage,
// si no lo encuentra, va a buscarlo en la API y luego de encontrarlo lo va a guardar en el local storage
async function fetchBlocksPage() {
    // first try to get the data from the local storage
    const cached_data = localStorage.getItem('blocks');
    if (cached_data) {
        console.log('fetchBlocksPage() - returning cached data'), JSON.parse(cached_data);
        return JSON.parse(cached_data);
    }
    const path = getPath();
    console.log('fetchBlocksPage() - fetching data from API');
    const result = await indexerApi.get(path);
    localStorage.setItem('blocks', JSON.stringify(result));
    console.log('fetchBlocksPage() - returning data from API', result);
    return result;
}

async function parseblocks() {
    if(loading.value){
        return;
    }
    loading.value = true;
    const { page, rowsPerPage, sortBy, descending } = pagination.value;

    try {
        let response = await fetchBlocksPage();
        if (pagination.value.rowsNumber === 0) {
            pagination.value.rowsNumber = response.data?.total_count;
        }

        pagination.value.page = page;
        pagination.value.rowsPerPage = rowsPerPage;
        pagination.value.sortBy = sortBy;
        pagination.value.descending = descending;

        blocks.splice(
            0,
            blocks.length,
            ...response.data.results,
        );
        rows.value = blocks;
        //        for (const block of blocks) {
        //            try {
        //                if (block.input === '0x') {
        //                    continue;
        //                }
        //                if(!block.to) {
        //                    continue;
        //                }
        //
        //                addEmptyToCache(response.data.contracts, block);
        //
        //                const contract = await contractManager.getContract(block.to);
        //
        //                if (!contract) {
        //                    continue;
        //                }
        //
        //                const parsedblock = await contractManager.parseContractBlock(
        //                    block, block.input, contract, true,
        //                );
        //                if (parsedblock) {
        //                    block.parsedblock = parsedblock;
        //                }
        //                block.contract = contract;
        //            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        //            } catch (e: any) {
        //                console.error(
        //                    `Failed to parse data for block, error was: ${e.message}`,
        //                );
        //                $q.notify({
        //                    message: $t('components.blocks.failed_to_parse_block', { message: e.message }),
        //                    color: 'negative',
        //                    position: 'top',
        //                    timeout: 5000,
        //                });
        //            }
        //        }
        loading.value = false;
        rows.value = blocks;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        $q.notify({
            type: 'negative',
            message: $t('components.blocks.transaction.load_error'),
            caption: e.message,
        });
        loading.value = false;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// function addEmptyToCache(contracts: any, transaction: any){
//     let found_to = 0;
//     let found_from = 0;
//     for(const contract in contracts){
//         if(contract.toLowerCase() === transaction.to.toLowerCase()) {
//             found_to++;
//         }
//         if(contract.toLowerCase() === transaction.from.toLowerCase()) {
//             found_from++;
//         }
//     }
//     if(found_from === 0){
//         contractManager.addContractToCache(transaction.from, { 'address': transaction.from });
//     }
//     if(found_to === 0){
//         contractManager.addContractToCache(transaction.to, { 'address': transaction.to });
//     }
// }

function getPath() {
    const { page, rowsPerPage, descending } = pagination.value;
    let path = `blocks?limit=${
        rowsPerPage === 0 ? 25 : rowsPerPage
    }`;
    path += `&offset=${(page - 1) * rowsPerPage}`;
    path += `&sort=${descending ? 'desc' : 'asc'}`;
    path += (pagination.value.rowsNumber === 0) ? '&includePagination=true' : '';  // We only need the count once
    return path;
}

function toggleDateFormat() {
    showDateAge.value = !showDateAge.value;
}

function getGasUsed(gasUsed: string) {
    const gas = ethers.BigNumber.from(gasUsed);
    try {
        return gas.toNumber().toLocaleString();
    } catch (e) {
        console.error(e);
        return gas.toString();
    }
}

function getTransactionsCount(transactionsCount: number | undefined) {
    return transactionsCount?.toLocaleString() ?? '0';
}

</script>

<template>
<q-table
    v-model:pagination="pagination"
    :rows="rows"
    :binary-state-sort="true"
    :rows-per-page-label="$t('global.records_per_page')"
    :row-key="row => row.number"
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
                <div class="u-flex--center-y">
                    {{ col.label }}
                    <template v-if="col.name === 'date'">
                        <q-icon
                            class="info-icon q-ml-xs"
                            name="fas fa-info-circle"
                            @click="toggleDateFormat"
                        >
                            <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                                {{ $t('components.blocks.click_to_change_format') }}
                            </q-tooltip>
                        </q-icon>
                    </template>
                    <template v-if="col.name === 'method'">
                        <q-icon class="info-icon" name="fas fa-info-circle q-ml-xs" />
                        <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                            {{ $t('components.blocks.executed_based_on_decoded_data') }}
                        </q-tooltip>
                    </template>
                </div>
            </q-th>
        </q-tr>
    </template>
    <template v-slot:body="props">
        <q-tr :key="props.row.number" :props="props">
            <q-td key="block" :props="props">
                <BlockField :block="props.row.number"/>
            </q-td>
            <q-td key="timestamp" :props="props">
                <DateField :epoch="props.row.timestamp / 1000" :force-show-age="showDateAge"/>
            </q-td>
            <q-td key='transactionsCount' :props="props">
                <span class="c-block-table__cell-trx">
                    {{
                        getTransactionsCount(props.row.transactionsCount) === '1'
                            ? $t('components.blocks.count_transaction')
                            : $t('components.blocks.count_transactions', {
                                count: getTransactionsCount(props.row.transactionsCount)
                            })
                    }}
                </span>
            </q-td>
            <q-td key='gasUsed' :props="props">
                <TokenValueField :value="getGasUsed(props.row.gasUsed)" />
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>

<style lang="sass">

</style>
