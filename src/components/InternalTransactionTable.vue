<script>
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import MethodField from 'components/MethodField';
import { formatWei } from 'src/lib/utils';
import { TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures';
import InternalTxns from 'components/Transaction/InternalTxns';

export default {
    name: 'InternalTransactionTable',
    components: {
        TransactionField,
        DateField,
        BlockField,
        MethodField,
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
                name: 'int_txns',
                label: '',
                align: 'right',
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
        this.columns[4].label = this.$t('components.internal_txns');
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
        popstate(event) {
            const page = event.state.pagination.page;
            const size = event.state.pagination.size;
            this.setPagination(page, size);
        },
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

            // this line cleans the table for a second and the components have to be created again (clean)
            this.rows = [];

            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            let result = await this.$evmEndpoint.get(this.getPath(props));

            if (this.total === null) {
                this.pagination.rowsNumber = result.data.total.value;
            }

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;

            this.transactions = [...result.data.transactions];
            this.rows = this.transactions;

            for (const transaction of this.transactions) {
                try {
                    transaction.transfer = false;
                    transaction.value = formatWei(transaction.value.toLocaleString(0, { useGrouping: false }), 18);
                    if (transaction.input_data === '0x') {
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

                    const parsedTransaction = await contract.parseTransaction(
                        transaction.input_data,
                    );
                    if (parsedTransaction) {
                        transaction.parsedTransaction = parsedTransaction;
                        transaction.contract = contract;
                    }
                    // Get ERC20 transfer from main function call
                    let signature = transaction.input_data.substring(0, 10);
                    if (
                        signature &&
                        TRANSFER_SIGNATURES.includes(signature) &&
                        transaction.parsedTransaction.args['amount']
                    ) {
                        let token = await this.$contractManager.getTokenData(transaction.to, 'erc20');
                        if(transaction.contract && token && token.decimals){
                            transaction.transfer = {
                                'value': `${formatWei(transaction.parsedTransaction.args['amount'], token.decimals)}`,
                                'symbol': token.symbol,
                            };
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
            this.rows = this.transactions;
            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            let path = `/v2/evm/get_transactions?limit=${
                rowsPerPage === 0 ? 500 : rowsPerPage
            }`;
            const filter = Object.assign({}, this.filter ? this.filter : {});
            if (filter.address) {
                path += `&address=${filter.address}`;
            }

            if (filter.block) {
                path += `&block=${filter.block}`;
            }

            if (filter.hash) {
                path += `&hash=${filter.hash}`;
            }

            path += `&skip=${(page - 1) * rowsPerPage}`;
            path += `&sort=${descending ? 'desc' : 'asc'}`;

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
                <div :class="[ 'u-flex--center-y', { 'u-flex--right': col.align === 'right' } ]" >
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
            <q-td auto-width/>
        </q-tr>
    </template>
    <template v-slot:body="props">
        <q-tr :props="props">
            <q-td key="hash" :props="props">
                <TransactionField :transaction-hash="props.row.hash"/>
            </q-td>
            <q-td key="block" :props="props">
                <BlockField :block="props.row.block"/>
            </q-td>
            <q-td key="date" :props="props">
                <DateField :epoch="props.row.epoch" :force-show-age="showDateAge"/>
            </q-td>
            <q-td key="method" :props="props">
                <MethodField v-if="props.row.parsedTransaction" :trx="props.row" :shortenName="true"/>
            </q-td>
            <q-td key="int_txns" :props="props">
                <span v-if="props.row.itxs.length > 0">
                    <b> {{ $t('components.n_internal_txns', {amount: props.row.itxs.length} ) }} </b>
                </span>
                <span v-else>{{ $t('components.none') }}</span>
            </q-td>
            <q-td auto-width>
                <q-icon
                    v-if="props.row.itxs.length > 0"
                    :name="props.expand ? 'expand_more' : 'expand_less'"
                    size="sm"
                    @click="props.expand = !props.expand"
                />
            </q-td>
        </q-tr>
        <q-tr
            v-show="!props.expand"
            v-if="props.row.itxs.length > 0"
            :props="props"
            class="q-virtual-scroll--with-prev"
        >
            <q-td colspan="100%">
                <InternalTxns :itxs="props.row.itxs"/>
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>
