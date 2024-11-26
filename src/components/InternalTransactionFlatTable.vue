<script>
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import AddressField from 'components/AddressField';
import ValueField from 'components/ValueField.vue';
import { getDirection } from 'src/lib/transaction-utils';
import { useChainStore } from 'src/core';

export default {
    name: 'InternalTransactionFlatTable',
    components: {
        TransactionField,
        AddressField,
        DateField,
        BlockField,
        ValueField,
    },
    props: {
        address: {
            type: String,
            required: true,
        },
        page: {
            type: Number,
        },
        filter: {
            type: Object,
            default: () => ({}),
        },
        initialPageSize: {
            type: Number,
            default: 25,
        },
        usePagination: {
            // when usePagination is false, we set the rowsPerPage to initialPageSize
            type: Boolean,
            default: true,
        },
    },
    computed: {
        rowsToShow() {
            return this.loading? this.loadingRows : this.rows;
        },
    },
    data() {
        const columns = [
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
        ];

        return {
            rows: [],
            loadingRows: [],
            columns,
            transactions: [],
            loading: true,
            pagination: {
                sortBy: 'date',
                descending: true,
                page: 1,
                rowsPerPage: 2,
                rowsNumber: 0,
            },
            page_size_options: [10, 20, 50],
            showDateAge: true,
            allExpanded: false,
        };
    },
    async created() {
        // initialization of the translated texts
        this.columns.filter(t => t.name === 'hash')[0].label = this.$t('components.tx_hash');
        this.columns.filter(t => t.name === 'block')[0].label = this.$t('components.block');
        this.columns.filter(t => t.name === 'date')[0].label = this.$t('components.age');
        this.columns.filter(t => t.name === 'type')[0].label = this.$t('components.approvals.type');
        this.columns.filter(t => t.name === 'from')[0].label = this.$t('pages.from');
        this.columns.filter(t => t.name === 'to')[0].label = this.$t('pages.to');
        this.columns.filter(t => t.name === 'value')[0].label = this.$t('pages.value');
        this.columns.filter(t => t.name === 'direction')[0].label = this.$t('components.direction');
        if (!this.usePagination) {
            this.pagination.rowsPerPage = this.initialPageSize;
        }
        this.updateLoadingRows();
    },
    watch: {
        '$route.query.page': {
            handler() {
                this.updateData();
            },
            immediate: true,
        },
        '$route.query.network': {
            handler() {
                this.loading = true;
                this.rows = [];
                this.updateData();
            },
        },
    },
    methods: {
        updateData() {
            const _pag = this.$route.query.page;
            let pag = _pag;
            let page = 1;
            let size = this.page_size_options[0];

            // we also allow to pass a single number as the page number
            if (typeof pag === 'number') {
                page = pag;
            } else if (typeof pag === 'string') {
                // we also allow to pass a string of two numbers: 'page,rowsPerPage'
                const [p, s] = pag.split(',');
                page = p;
                size = s;
            }
            this.setPagination(page, size);
        },
        getDirection: getDirection,
        updateLoadingRows() {
            this.loadingRows = [];
            for (var i = 1; i <= this.pagination.rowsPerPage; i++) {
                this.loadingRows.push(i);
            }
        },
        popstate(event) {
            const page = event.state.pagination.page;
            const size = event.state.pagination.size;
            this.setPagination(page, size);
        },
        setPagination(page, size) {
            if (page) {
                this.pagination.page = Number(page);
            }

            if (this.usePagination) {
                if (size) {
                    this.pagination.rowsPerPage = Number(size);
                }
            } else {
                this.pagination.rowsPerPage = this.initialPageSize;
            }

            this.updateLoadingRows();
            this.onRequest({
                pagination: this.pagination,
            });
        },
        async onPaginationChange(props) {
            const { page, rowsPerPage } = props.pagination;

            // we need to change the URL to keep the pagination state by changing the this.$route.query.page
            // with a string like 'page,rowsPerPage'
            this.$router.push({
                // taking care to preserve the current #hash anchor and the current query parameters
                hash: window.location.hash,
                query: {
                    ...this.$route.query,
                    page: `${page},${rowsPerPage}`,
                },
            });
        },
        async onRequest(props) {
            const chainSettings = useChainStore().currentChain.settings;
            this.loading = true;
            this.rows = [];
            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            const path = this.getPath(props);
            const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
            let result = await indexerApi.get(path);
            if (!this.pagination.rowsNumber) {
                this.pagination.rowsNumber = result.data.total_count;
            }
            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;

            // Process the result data
            let processedTransactions = 0;
            let lastTransactionHash = '';
            const totalEntries = [];
            result.data.results.forEach((internalTrx) => {
                if (internalTrx.transactionHash !== lastTransactionHash) {
                    processedTransactions++;
                    lastTransactionHash = internalTrx.transactionHash;
                }
                const entry = {
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

            this.rows = totalEntries;

            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            let path;
            const limit = Math.max(rowsPerPage, this.page_size_options[0]);
            console.assert(limit > 0, `Rows per page must be greater than 0, got ${limit}`);

            const filter = Object.assign({}, this.filter ? this.filter : {});
            if (this.address) {
                path = `v1/address/${this.address}/internal?limit=${limit}`;
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

            path += (!this.pagination.rowsNumber) ? '&includePagination=true' : '';  // We only need the count once

            return path;
        },
        toggleDateFormat() {
            this.showDateAge = !this.showDateAge;
        },
        toggleAllExpanded() {
            this.allExpanded = !this.allExpanded;
            this.rows.forEach((row) => {
                row.expand = this.allExpanded;
            });
            this.saveAllExpanded();
        },
        loadAllExpanded() {
            // we look for the local Storage to see if the user has already expanded all the rows
            const allExpanded = localStorage.getItem('allExpanded');
            if (allExpanded) {
                this.allExpanded = allExpanded === 'true';
            }
        },
        saveAllExpanded() {
            // we save the state of the allExpanded variable in the local storage
            localStorage.setItem('allExpanded', this.allExpanded);
        },
    },
};
</script>

if(row.get("timeStamp") != null){
    long epoch = FormatterUtils.getEpochFromSQLTimestamp(row.get("timeStamp").toString());
    row.replace("timeStamp", epoch);
}

<template>
<q-table
    v-model:pagination="pagination"
    class="c-inttrx-flat__table"
    :rows="rowsToShow"
    :row-key="row => row.hash"
    :columns="columns"
    :rows-per-page-options="page_size_options"
    @request="onPaginationChange"
>
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
