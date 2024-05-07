<script>
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import AddressField from 'components/AddressField';
import ValueField from 'components/ValueField.vue';
import { getDirection } from 'src/lib/transaction-utils';
import { WEI_PRECISION, formatWei } from 'src/lib/utils';
import { TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures';

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
        pagesize: {
            type: Number,
        },
        filter: {
            type: Object,
            default: () => ({}),
        },
        initialPageSize: {
            type: Number,
            default: 1,
        },
        usePagination: {
            type: Boolean,
            default: true,
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
            {
                name: 'count',
                label: 'count',
                align: 'right',
            },
        ];

        return {
            rows: [],
            loadingRows: [],
            columns,
            transactions: [],
            pageSize: this.initialPageSize,
            loading: false,
            pagination: {
                sortBy: 'date',
                descending: true,
                page: 1,
                rowsPerPage: 10,
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
        this.columns.filter(t => t.name === 'count')[0].label = this.$t('pages.count');
        if (!this.usePagination) {
            this.pagination.rowsPerPage = 25;
            // we need to remove type and count columns
            this.columns = this.columns.filter(col => col.name !== 'type');
            this.columns = this.columns.filter(col => col.name !== 'count');
        }
        this.loadAllExpanded();
        this.updateLoadingRows();
    },
    watch: {
        '$route.query.page': {
            handler(_pag) {
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
            immediate: true,
        },
    },
    methods: {
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
                this.pagination.rowsPerPage = 0;
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
            this.loading = true;
            // this line cleans the table for a second and the components have to be created again (clean)
            this.rows = [];
            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            const path = this.getPath(props);
            let result = await this.$indexerApi.get(path);
            if (!this.pagination.rowsNumber) {
                this.pagination.rowsNumber = result.data.total_count;
            }
            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;
            this.transactions = [...result.data.results];
            let totalTraces = 0;
            let processedTransactions = 0;
            for (const transaction of this.transactions) {
                try {
                    transaction.transfer = false;
                    transaction.value = formatWei(transaction.value.toLocaleString(0, { useGrouping: false }), 18);
                    if (transaction.input === '0x') {
                        continue;
                    }
                    if(!transaction.to) {
                        continue;
                    }
                    const contract = await this.$contractManager.getContract(
                        transaction.to,
                    );
                    if (!contract) {
                        continue;
                    }
                    if (totalTraces >= 25 && !this.usePagination) {
                        // we already have enough data
                        break;
                    }
                    let traces = await this.$indexerApi.get(
                        '/transaction/' + transaction.hash + '/internal?limit=1000&sort=ASC&offset=0&includeAbi=1',
                    );
                    for(const trace of [...traces.data.results]){
                        trace.hash = trace.transactionHash;
                    }
                    transaction.traces = traces.data?.results;
                    totalTraces += +transaction.traces?.length;
                    transaction.contract = contract;
                    transaction.contractAddress = contract.address;
                    const parsedTransaction = await this.$contractManager.parseContractTransaction(
                        transaction,
                        transaction.input,
                        contract,
                    );
                    transaction.parsedTransaction = parsedTransaction;
                    // Get ERC20 transfer from main function call
                    let signature = transaction.input.substring(0, 10);
                    if (
                        signature &&
                        TRANSFER_SIGNATURES.includes(signature) &&
                        transaction.parsedTransaction.args['amount']
                    ) {
                        let decimals = transaction.contract.properties?.decimals;
                        if(transaction.contract && decimals){
                            transaction.transfer = {
                                'value': `${formatWei(transaction.parsedTransaction.args['amount'], decimals)}`,
                                'symbol': transaction.contract.properties.symbol,
                            };
                        }
                    }

                    processedTransactions++;
                    const entries = [];
                    transaction.traces.forEach((trace) => {
                        const entry = {
                            trx: processedTransactions % 2 === 0 ? 'even' : 'odd',
                            hash: transaction.hash,
                            blockNumber: transaction.blockNumber,
                            timestamp: transaction.timestamp,
                            type: trace.action.callType,
                            from: trace.action.from,
                            to: trace.action.to,
                            value: trace.action.value,
                            symbol: 'TLOS',
                            decimals: WEI_PRECISION,
                        };
                        entries.push(entry);
                    });

                    if (this.usePagination) {
                        const entry = {
                            trx: processedTransactions % 2 === 0 ? 'even' : 'odd',
                            hash: transaction.hash,
                            blockNumber: transaction.blockNumber,
                            timestamp: transaction.timestamp,
                            type: entries[0].type,
                            from: transaction.from,
                            to: transaction.to,
                            value: transaction.value,
                            symbol: 'TLOS',
                            decimals: WEI_PRECISION,
                            traces: entries,
                            expand: true,
                        };
                        this.rows.push(entry);
                    } else {
                        this.rows = this.rows.concat(entries);
                        // we make sure there are no more than 25 rows.
                        // If we have more than 25 rows, we discard the rest
                        if (this.rows.length > 25) {
                            this.rows = this.rows.slice(0, 25);
                        }
                    }

                } catch (e) {
                    console.error(
                        `Failed to parse data for transaction, error was: ${e.message}`,
                    );
                    // notifiy user
                    this.$q.notify({
                        message: this.$t('components.failed_to_parse_transaction', { message: e.message }),
                        color: 'negative',
                        position: 'top',
                        timeout: 5000,
                    });
                }
            }
            this.rows.forEach((row) => {
                row.expand = this.allExpanded;
            });
            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            let path;
            const filter = Object.assign({}, this.filter ? this.filter : {});
            if (this.address) {
                path = `/address/${this.address}/transactions`;
            } else {
                path = '/transactions';
            }
            path += `?limit=${
                rowsPerPage === 0 ? 25 : rowsPerPage
            }`;

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

<template>
<q-table
    v-model:pagination="pagination"
    class="c-inttrx-flat__table"
    :rows="loading? loadingRows : rows"
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
                <span class="c-inttrx-flat__footer-text"> See all transactions </span>
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
                        <q-icon
                            class="info-icon"
                            name="far fa-question-circle"
                        >
                            <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                                {{ $t('components.click_to_change_format') }}
                            </q-tooltip>
                        </q-icon>
                    </div>
                </template>

                <div v-else-if="col.name === 'count'">
                    {{ col.label }}
                    <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                        {{ $t('pages.internal_txns') }}
                    </q-tooltip>
                </div>
                <div v-else>
                    {{ col.label }}
                </div>
            </q-th>
            <q-th v-if="usePagination" auto-width>
                <q-btn
                    :icon="allExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
                    flat
                    round
                    dense
                    @click="toggleAllExpanded()"
                >
                    <q-tooltip>{{ allExpanded ? $t('components.collapse_all') : $t('components.expand_all') }}</q-tooltip>
                </q-btn>
            </q-th>
        </q-tr>
    </template>
    <template v-slot:body="props">
        <template v-if="loading">
            <q-tr>
                <!-- we need to iterate 7 times if usePagination and 10 times if not -->
                <q-td
                    v-for="i in (usePagination ? 10 : 7)"
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
                    <DateField :epoch="(props.row.timestamp / 1000)" :force-show-age="showDateAge"/>
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
                <q-td key="count" :props="props">
                    {{ props.row.traces.length }}
                </q-td>
                <q-td v-if="usePagination" auto-width>
                    <!-- we need a switch to expand the rows below -->
                    <q-btn
                        :icon="props.row.expand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
                        flat
                        round
                        dense
                        @click="props.row.expand = !props.row.expand"
                    />
                </q-td>
            </q-tr>
            <q-tr
                v-for="(trace, index) in props.row.traces"
                v-show="props.row.expand"
                :key="`${trace.hash}-${index}`"
                :props="props"
                :class="props.row.trx"
            >
                <q-td key="hash" :props="props">
                    <TransactionField :transaction-hash="trace.hash" :useHighlight="true"/>
                </q-td>
                <q-td key="block" :props="props">
                    <BlockField :block="trace.blockNumber"/>
                </q-td>
                <q-td key="date" :props="props">
                    <DateField :epoch="(trace.timestamp / 1000)" :force-show-age="showDateAge"/>
                </q-td>
                <q-td key="type" :props="props">
                    {{ trace.type }}
                </q-td>
                <q-td key="from" :props="props">
                    <AddressField
                        v-if="trace.from"
                        :key="trace.from"
                        :address="trace.from"
                        :truncate="12"
                    />
                </q-td>
                <q-td key="direction" :props="props">
                    <span
                        :class="`direction ${getDirection(address, trace)}`"
                    >
                        {{ $t(`components.transaction.${getDirection(address, trace)}`).toUpperCase() }}
                    </span>
                </q-td>
                <q-td key="to" :props="props">
                    <AddressField
                        v-if="trace.to"
                        :key="trace.to"
                        :address="trace.to"
                        :truncate="12"
                    />
                </q-td>
                <q-td key="value" :props="props">
                    <ValueField
                        :value="trace.value"
                        :symbol="trace.symbol"
                        :decimals="trace.decimals"
                    />
                </q-td>
                <q-td key="count" :props="props" />
                <q-td v-if="usePagination" auto-width/>
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
