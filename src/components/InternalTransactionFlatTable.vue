<script>
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import AddressField from 'components/AddressField';
import InternalTxns from 'components/Transaction/InternalTxns';
import ValueField from 'components/ValueField.vue';
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
        InternalTxns,
    },
    props: {
        page: {
            type: Number,
        },
        pagesize: {
            type: Number,
        },
        title: {
            type: String,
            required: true,
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
    computed: {
        address() {
            return this.filter?.address ?? '';
        },
    },
    data() {
        const columns = [
            {
                name: 'hash',
                label: '',
                align: 'left',
            },
            {
                name: 'block',
                label: '',
                align: 'left',
            },
            {
                name: 'date',
                label: '',
                align: 'left',
            },
            {
                name: 'from',
                label: '',
                align: 'left',
            },
            {
                name: 'to',
                label: '',
                align: 'left',
            },
            {
                name: 'value',
                label: '',
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
        };
    },
    async created() {
        // initialization of the translated texts
        this.columns[0].label = this.$t('components.tx_hash');
        this.columns[1].label = this.$t('components.block');
        this.columns[2].label = this.$t('components.age');
        this.columns[3].label = this.$t('pages.from');
        this.columns[4].label = this.$t('pages.to');
        this.columns[5].label = this.$t('pages.value');
        if (!this.usePagination) {
            this.pagination.rowsPerPage = 25;
        }
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
                    if (totalTraces >= 25 && !props.usePagination) {
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
                    transaction.traces.forEach((trace) => {
                        const entry = {
                            trx: processedTransactions % 2 === 0 ? 'even' : 'odd',
                            hash: transaction.hash,
                            blockNumber: transaction.blockNumber,
                            timestamp: transaction.timestamp,
                            from: trace.action.from,
                            to: trace.action.to,
                            value: trace.action.value,
                            symbol: 'TLOS',
                            decimals: WEI_PRECISION,
                        };
                        this.rows.push(entry);
                    });

                    // TODO: if we want to crop in exactly 25 rows, we need to uncomment this
                    // if (!this.usePagination) {
                    //     // we make sure there are no more than 25 rows.
                    //     // If we have more than 25 rows, we discard the rest
                    //     if (this.rows.length > 25) {
                    //         this.rows = this.rows.slice(0, 25);
                    //     }
                    // }

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
            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            let path;
            const filter = Object.assign({}, this.filter ? this.filter : {});
            if (filter.address) {
                path = `/address/${filter.address}/transactions`;
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
    },
};
</script>

<template>
<q-table
    v-if="!loading"
    v-model:pagination="pagination"
    class="c-inttrx-flat__table"
    :rows="rows"
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
            <router-link class="c-inttrx-flat__footer-container" :to="{ name: 'txsInternal', query: { a: address } }">
                <span class="c-inttrx-flat__footer-text"> See all transactions </span>
                <q-icon name="arrow_forward" class="c-inttrx-flat__footer-icon" />
            </router-link>
        </q-card-actions>
    </template>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <div :class="[ 'c-inttrx-flat__header-age', 'u-flex--center-y', { 'u-flex--right': col.align === 'right' } ]" @click="toggleDateFormat">
                    <template
                        v-if="col.name === 'date'"
                    >
                        <a>{{ showDateAge ? col.label: $t('components.date') }}</a>
                        <q-icon
                            class="info-icon"
                            name="far fa-question-circle"
                        >
                            <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                                {{ $t('components.click_to_change_format') }}
                            </q-tooltip>
                        </q-icon>
                    </template>
                    <div v-else-if="col.name === 'method'">
                        {{ col.label }}
                        <q-icon class="info-icon" name="far fa-question-circle" />
                        <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                            {{ $t('components.executed_based_on_decoded_data') }}
                        </q-tooltip>
                    </div>
                    <div v-else>
                        {{ col.label }}
                    </div>
                </div>
            </q-th>
            <q-td v-if="usePagination" auto-width/>
        </q-tr>
    </template>
    <template v-slot:body="props">
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
            <q-td key="value" :props="props">
                <ValueField
                    :value="props.row.value"
                    :symbol="props.row.symbol"
                    :decimals="props.row.decimals"
                />
            </q-td>
        </q-tr>
        <q-tr
            v-show="props.expand"
            v-if="props.row.traces?.length > 0"
            :props="props"
            class="q-virtual-scroll--with-prev"
        >
            <q-td colspan="100%">
                <InternalTxns :traces="props.row.traces" :transaction="props.row" />
            </q-td>
        </q-tr>
    </template>
</q-table>
<q-table
    v-else
    v-model:pagination="pagination"
    class="c-inttrx-flat__table"
    :rows="loadingRows"
    :row-key="row => row.hash"
    :columns="columns"
    :rows-per-page-options="page_size_options"
>
    <template v-if="!usePagination" v-slot:bottom>
        <q-card-actions
            align="center"
            class="c-inttrx-flat__footer"
        >
            <router-link class="c-inttrx-flat__footer-container" :to="{ name: 'txsInternal' }">
                <span class="c-inttrx-flat__footer-text"> See all transactions </span>
                <q-icon name="arrow_forward" class="c-inttrx-flat__footer-icon" />
            </router-link>
        </q-card-actions>
    </template>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <div :class="[ 'c-inttrx-flat__header-age', 'u-flex--center-y', { 'u-flex--right': col.align === 'right' } ]" @click="toggleDateFormat">
                    <template
                        v-if="col.name === 'date'"
                    >
                        <a>{{ showDateAge ? col.label: $t('components.date') }}</a>
                        <q-icon
                            class="info-icon"
                            name="far fa-question-circle"
                        >
                            <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                                {{ $t('components.click_to_change_format') }}
                            </q-tooltip>
                        </q-icon>
                    </template>
                    <div v-else-if="col.name === 'method'">
                        {{ col.label }}
                        <q-icon class="info-icon" name="far fa-question-circle" />
                        <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                            {{ $t('components.executed_based_on_decoded_data') }}
                        </q-tooltip>
                    </div>
                    <div v-else>
                        {{ col.label }}
                    </div>
                </div>
            </q-th>
            <q-td auto-width/>
        </q-tr>
    </template>
    <template v-slot:body="">
        <q-tr>
            <q-td key="hash" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="block" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="date" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="method" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="int_txns" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="value" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td v-if="usePagination" auto-width>
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>
<style lang="scss">

.odd {
        background-color: var(--scrollbar-track-bg-color);
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