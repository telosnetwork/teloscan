<script>
import AddressField from 'components/AddressField';
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import MethodField from 'components/MethodField';
import { formatWei } from 'src/lib/utils';

export default {
    name: 'TransactionTable',
    components: {
        TransactionField,
        DateField,
        BlockField,
        AddressField,
        MethodField,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        filter: {
            type: String,
            default: '',
        },
        initialPageSize: {
            type: Number,
            default: 1,
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
                name: 'method',
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
                align: 'left',
            },
        ];

        return {
            rows: [],
            columns,
            transactions: [],
            pageSize: this.initialPageSize,
            total: null,
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
        this.columns[2].label = this.$t('components.date');
        this.columns[3].label = this.$t('components.method');
        this.columns[4].label = this.$t('components.from');
        this.columns[5].label = this.$t('components.to_interacted_with');
        this.columns[6].label = this.$t('components.value_transfer');
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
        setPagination(page, size) {
            if (page) {
                this.pagination.page = Number(page);
            }
            if (size) {
                this.pagination.rowsPerPage = Number(size);
            }
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

            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            let response = await this.$indexerApi.get(this.getPath(props));
            if (this.total === null) {
                this.pagination.rowsNumber = response.data.total_count;
            }

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;

            this.transactions.splice(
                0,
                this.transactions.length,
                ...response.data.results,
            );
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

                    const parsedTransaction = await this.$contractManager.parseContractTransaction(
                        transaction.input, contract,
                    );
                    if (parsedTransaction) {
                        transaction.parsedTransaction = parsedTransaction;
                    }
                    transaction.contract = contract;
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
            this.rows = this.transactions;
            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            const filter =  (this.filter.toString().length > 0) ? this.filter.toString() : '';
            let path = `${filter}/transactions?limit=${
                rowsPerPage === 0 ? 500 : rowsPerPage
            }`;
            path += `&offset=${(page - 1) * rowsPerPage}`;
            path += `&sort=${descending ? 'desc' : 'asc'}`;
            path += '&includePagination=true&includeAbi=true';
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
    v-model:pagination="pagination"
    :rows="rows"
    :row-key="row => row.hash"
    :columns="columns"
    :loading="loading"
    :rows-per-page-options="page_size_options"
    flat
    @request="onPaginationChange"
>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <div class="u-flex--center-y">
                    {{ col.label }}
                    <template v-if="col.name === 'date'">
                        <q-icon
                            class="info-icon"
                            name="fas fa-info-circle"
                            @click="toggleDateFormat"
                        >
                            <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                                {{ $t('components.click_to_change_format') }}
                            </q-tooltip>
                        </q-icon>
                    </template>
                    <template v-if="col.name === 'method'">
                        <q-icon class="info-icon" name="fas fa-info-circle" />
                        <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                            {{ $t('components.executed_based_on_decoded_data') }}
                        </q-tooltip>
                    </template>
                </div>
            </q-th>
        </q-tr>
    </template>
    <template v-slot:body="props">
        <q-tr :props="props">
            <q-td key="hash" :props="props">
                <TransactionField :transaction-hash="props.row.hash"/>
            </q-td>
            <q-td key="block" :props="props">
                <BlockField :block="props.row.blockNumber"/>
            </q-td>
            <q-td key="date" :props="props">
                <DateField :epoch="props.row.timestamp / 1000" :force-show-age="showDateAge"/>
            </q-td>
            <q-td key="method" :props="props">
                <MethodField v-if="props.row.parsedTransaction" :trx="props.row" :shortenName="true"/>
            </q-td>
            <q-td key="from" :props="props">
                <AddressField v-if="props.row.from" :address="props.row.from"/>
            </q-td>
            <q-td key="to" :props="props">
                <AddressField
                    v-if="props.row.to"
                    :key="props.row.to + ((props.row.contract) ? '1' : '0')"
                    :address="props.row.to"
                    :isContractTrx="!!(props.row.contract)"
                />
            </q-td>
            <q-td key="value" :props="props">
                <span v-if="props.row.value > 0 ||  !props.row.transfer ">
                    {{ props.row.value }} TLOS
                </span>
                <div v-else>
                    <span v-if="props.row.transfer">
                        {{ props.row.transfer.value }} {{ props.row.transfer.symbol }}
                    </span>
                </div>
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>
