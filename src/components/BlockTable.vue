<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import EmptyTableSign from 'components/EmptyTableSign.vue';
import { BlockData } from 'src/types';
import { ethers } from 'ethers';

import { Pagination } from 'src/types';
import { useChainStore } from 'src/core';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { t: $t } = useI18n();

export interface BlockTableProps {
    title: string;
    initialPageSize?: number,
    showEmptyBlocks?: boolean,
}

const props = withDefaults(defineProps<BlockTableProps>(), {
    title: '',
    initialPageSize: 25,
    showEmptyBlocks: false,
});

const rows = ref<Array<BlockData>>([]);
const loadingRows = ref<Array<number>>([]);
const loading = ref(false);
const showDateAge = ref(true);
const blocks: BlockData[] = [];
const page_size_options = [10, 25, 50, 100];

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

watch(() => route.query,
    () => {
        let page = 1;
        let desc = true;
        let size = page_size_options[0];
        const pageParam = route.query.page;

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

watch(() => props.showEmptyBlocks, () => {
    parseBlocks();
}, { immediate: true },
);

function setPagination(page: number, size: number, desc: boolean) {
    if (page) {
        pagination.value.page = page;
    }
    if (size) {
        pagination.value.rowsPerPage = size;
    }
    pagination.value.descending = desc;
    parseBlocks();
}

async function onPaginationChange(settings: { pagination: Pagination}) {
    const { page, rowsPerPage, descending } = settings.pagination;
    router.push({
        hash: window.location.hash,
        query: {
            ...route.query,
            page: `${page},${rowsPerPage},${(descending) ? 'DESC' : 'ASC'}`,
        },
    });
}


async function fetchBlocksPage() {
    const path = getPath();
    const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
    const result = await indexerApi.get(path);
    if (pagination.value.rowsNumber === 0) {
        pagination.value.rowsNumber = result.data?.total_count ?? 0;
    }
    return result;
}

async function parseBlocks() {
    if(loading.value){
        return;
    }
    loading.value = true;
    const { page, rowsPerPage, sortBy, descending } = pagination.value;

    try {
        let response = await fetchBlocksPage();

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
        loading.value = false;
        rows.value = blocks;
    } catch (e: unknown) {
        $q.notify({
            type: 'negative',
            message: $t('components.transaction.load_error'),
            caption: (e as {message:string}).message,
        });
        loading.value = false;
    }
}


function getPath() {
    const { page, rowsPerPage, descending } = pagination.value;
    let path = `v1/blocks?limit=${
        rowsPerPage === 0 ? 25 : rowsPerPage
    }`;
    path += `&offset=${(page - 1) * rowsPerPage}`;
    path += `&sort=${descending ? 'desc' : 'asc'}`;
    path += '&includePagination=true';
    if (!props.showEmptyBlocks){
        path += '&noEmpty=true';
    }

    return path;
}

function toggleDateFormat() {
    showDateAge.value = !showDateAge.value;
}

function getGasUsed(gasUsed: string) {
    if (gasUsed) {
        const gas = ethers.BigNumber.from(gasUsed);
        try {
            return gas.toNumber().toLocaleString();
        } catch (e) {
            console.error(e);
            return gas.toString();
        }
    }
    return '0';
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
<q-table
    v-if="!loading"
    v-model:pagination="pagination"
    class="c-block-table"
    :rows="rows"
    :binary-state-sort="true"
    :rows-per-page-label="$t('global.records_per_page')"
    :row-key="row => row.blockNumber"
    :columns="(columns as any)"
    :rows-per-page-options="page_size_options"
    @request="onPaginationChange"
>
    <template v-slot:no-data>
        <EmptyTableSign />
    </template>
    <!-- header template -->
    <template v-slot:header="props">
        <!--pre>{{ props }}</pre-->
        <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <template v-if="col.name === 'date'">
                    <div class="u-flex--center-y" @click="toggleDateFormat">
                        {{ col.label }}
                        <q-icon class="info-icon" name="far fa-question-circle" />
                        <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                            {{ $t('components.blocks.click_to_change_format') }}
                        </q-tooltip>
                    </div>
                </template>
                <template v-else-if="col.name === 'method'">
                    <div class="u-flex--center-y">
                        {{ col.label }}
                    </div>
                    <q-icon class="info-icon" name="fas fa-info-circle q-ml-xs" />
                    <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                        {{ $t('components.blocks.executed_based_on_decoded_data') }}
                    </q-tooltip>
                </template>
                <template v-else>
                    <!-- default header -->
                    <div class="u-flex--center-y">
                        {{ col.label }}
                    </div>
                </template>
            </q-th>
        </q-tr>
    </template>
    <template v-slot:body="props">
        <q-tr :key="props.row.blockNumber" :props="props">
            <q-td key="block" :props="props">
                <BlockField :block="props.row.blockNumber"/>
            </q-td>
            <q-td key="timestamp" :props="props">
                <DateField :epoch="props.row.timestamp / 1000" :force-show-age="showDateAge"/>
                <q-tooltip anchor="center left" self="center middle" :offset="[-100, -60]">
                    <DateField :epoch="props.row.timestamp / 1000" :force-show-age="false"/>
                </q-tooltip>
            </q-td>
            <q-td key='transactionsCount' :props="props">
                <span class="c-block-table__cell-trx">
                    {{
                        props.row.transactionsCount === 1
                            ? $t('components.blocks.count_transaction')
                            : $t('components.blocks.count_transactions', {
                                count: props.row.transactionsCount
                            })
                    }}
                </span>
            </q-td>
            <q-td key='gasUsed' class="c-block-table__td-gas-used" :props="props">
                {{ getGasUsed(props.row.gasUsed) }}
            </q-td>
        </q-tr>
    </template>
</q-table>
<q-table
    v-else
    v-model:pagination="pagination"
    class="c-block-table"
    :rows="loadingRows"
    :binary-state-sort="true"
    :rows-per-page-label="$t('global.records_per_page')"
    :columns="(columns as any)"
    :rows-per-page-options="page_size_options"
>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <template v-if="col.name === 'date'">
                    <div class="u-flex--center-y" @click="toggleDateFormat">
                        {{ col.label }}
                        <q-icon class="info-icon" name="far fa-question-circle" />
                        <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                            {{ $t('components.blocks.click_to_change_format') }}
                        </q-tooltip>
                    </div>
                </template>
                <template v-if="col.name === 'method'">
                    <div class="u-flex--center-y">
                        {{ col.label }}
                    </div>
                    <q-icon class="info-icon" name="fas fa-info-circle q-ml-xs" />
                    <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                        {{ $t('components.blocks.executed_based_on_decoded_data') }}
                    </q-tooltip>
                </template>
            </q-th>
        </q-tr>
    </template>
    <template v-slot:body="">
        <q-tr>
            <q-td key="block">
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="timestamp">
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key='transactionsCount'>
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key='gasUsed' class="c-block-table__td-gas-used">
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>

<style lang="scss">
.c-block-table {
    &__td-gas-used {
        padding-right: 12% !important;
    }
    @media screen and (max-width: 900px) {
        &__td-gas-used {
            padding-right: 7% !important;
        }
    }
    @media screen and (max-width: 600px) {
        &__td-gas-used {
            padding-right: 3% !important;
        }
    }
}
</style>
