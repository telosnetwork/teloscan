<script>
import AddressField from 'components/AddressField';
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import MethodField from 'components/MethodField';
import { formatBN } from 'src/lib/utils';
import { TRANSFER_FUNCTION_SIGNATURES } from 'src/lib/functionSignatures';

const columns = [
    {
        name: 'hash',
        label: 'TX Hash',
        align: 'left',
    },
    {
        name: 'block',
        label: 'Block',
        align: 'left',
    },
    {
        name: 'date',
        label: 'Date',
        align: 'left',
    },
    {
        name: 'method',
        label: 'Method',
        align: 'left',
    },
    {
        name: 'from',
        label: 'From',
        align: 'left',
    },
    {
        name: 'to',
        label: 'To / Interacted with',
        align: 'left',
    },
    {
        name: 'value',
        label: 'Value / Transfer',
        align: 'left',
    },
];

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
            type: Object,
            default: () => ({}),
        },
        initialPageSize: {
            type: Number,
            default: 1,
        },
    },
    data() {
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
            showAge: true,
        };
    },
    mounted() {
        this.onRequest({
            pagination: this.pagination,
        });
    },
    methods: {
        async onRequest(props) {
            this.loading = true;

            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            let result = await this.$evmEndpoint.get(this.getPath(props));

            if (this.total == null)
                this.pagination.rowsNumber = result.data.total.value;

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;

            this.transactions.splice(
                0,
                this.transactions.length,
                ...result.data.transactions,
            );
            for (const transaction of this.transactions) {
                try {
                    transaction.transfers = [];
                    if (transaction.input_data === '0x') continue;
                    if(!transaction.to) continue;
                    const contract = await this.$contractManager.getContract(
                        transaction.to,
                    );
                    if (!contract) continue;

                    const parsedTransaction = await contract.parseTransaction(
                        transaction.input_data,
                    );
                    if (parsedTransaction) {
                        transaction.parsedTransaction = parsedTransaction;
                        transaction.contract = contract;
                    }
                    transaction.logs.forEach(log => {
                        log.topics.forEach(async  topic =>  {
                            let signature = topic.substring(0, 10)
                            if (TRANSFER_FUNCTION_SIGNATURES.includes(signature)) {
                                if(transaction.contract && transaction.contract.token && transaction.parsedTransaction.args['amount']){
                                    transaction.transfers.push({'value': `${formatBN(transaction.parsedTransaction.args['amount'], transaction.contract.token.decimals, 5)}`, 'symbol': transaction.contract.token.symbol})
                                }
                            }
                        })
                    })
                    transaction.transfers.sort((a,b) => a.value - b.value);
                } catch (e) {
                    console.error(
                        `Failed to parse data for transaction, error was: ${e.message}`,
                    );
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
            if (filter.address) path += `&address=${filter.address}`;

            if (filter.block) path += `&block=${filter.block}`;

            if (filter.hash) path += `&hash=${filter.hash}`;

            path += `&skip=${(page - 1) * rowsPerPage}`;
            path += `&sort=${descending ? 'desc' : 'asc'}`;

            return path;
        },
    },
};
</script>

<template lang="pug">
q-table(
    :rows="rows"
    :row-key='row => row.hash'
    :columns="columns"
    v-model:pagination="pagination"
    :loading="loading"
    @request="onRequest"
    :rows-per-page-options="[10, 20, 50]"
    flat
)
    q-tr( slot="header" slot-scope="props" :props="props" )
        q-th(
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            @click="col.name==='date' ? showAge=!showAge : null"
        )
        template( v-if="col.name==='date'" )
            q-tooltip(anchor="bottom middle" self="bottom middle") Click to change format
        | {{ col.label }}
        template( v-if="col.name === 'method'" )
        q-icon(name="fas fa-info-circle", style="margin-top: -5px; margin-left: 3px;").info-icon
            q-tooltip(anchor="bottom middle" self="top middle" max-width="10rem") Function executed based on decoded input data. For unidentified function, method ID is displayed instead.

    template(v-slot:body="props")
        q-tr( :props="props" )
            q-td( key="hash" :props="props" )
                transaction-field( :transaction-hash="props.row.hash" )
            q-td( key="block" :props="props")
                block-field( :block="props.row.block" )
            q-td( key="date" :props="props")
                date-field( :epoch="props.row.epoch", :showAge="showAge" )
            q-td( key="method" :props="props")
                method-field( v-if="props.row.parsedTransaction" :trx="props.row" :shorten="true" )
            q-td( key="from" :props="props")
                address-field(v-if="props.row.from" :address="props.row.from" )
            q-td( key="to" :props="props")
                address-field(v-if="props.row.to" :address="props.row.to" :is-contract-trx="props.row.input_data !== '0x'" )
            q-td( key="value" :props="props")
                span(v-if="props.row.value > 0 ||  !props.row.transfers || props.row.transfers.length == 0") {{ (props.row.value / 1000000000000000000).toFixed(5) }} TLOS
                div(v-else)
                    span(v-if="props.row.transfers &&  props.row.transfers.length > 0") {{ props.row.transfers[0].value }} {{ props.row.transfers[0].symbol }}
                    small(v-if="props.row.transfers &&  props.row.transfers.length > 1") +{{ props.row.transfers.length - 1 }}
</template>
