<script>
import AddressField from 'components/AddressField';
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import MethodField from 'components/MethodField';
import { formatWei } from 'src/lib/utils';
import { TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures';

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
                    transaction.transfer = false;
                    transaction.value = formatWei(transaction.value.toLocaleString(0, {useGrouping: false}), 18);
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
                    // Get ERC20 transfer from main function call
                    let signature = transaction.input_data.substring(0, 10);
                    if (signature && TRANSFER_SIGNATURES.includes(signature) && transaction.parsedTransaction.args['amount']) {
                        let token = await this.$contractManager.getTokenData(transaction.to, 'erc20');
                        if(transaction.contract && token && token.decimals){
                            transaction.transfer = {'value': `${formatWei(transaction.parsedTransaction.args['amount'], token.decimals)}`, 'symbol': token.symbol};
                        }
                    }
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
        q-tr( :props="props")
            q-td( key="hash" :props="props" )
                transaction-field( :transaction-hash="props.row.hash" )
            q-td( key="block" :props="props")
                block-field( :block="props.row.block" )
            q-td( key="date" :props="props")
                date-field( :epoch="props.row.epoch", :showAge="showAge" )
            q-td( key="method" :props="props")
                method-field( v-if="props.row.parsedTransaction" :trx="props.row" :shortenName="true"  )
            q-td( key="from" :props="props")
                address-field(v-if="props.row.from" :address="props.row.from" )
            q-td( key="to" :props="props")
                address-field(v-if="props.row.to" :key="props.row.to + ((props.row.contract) ? '1' : '0')" :address="props.row.to" :isContractTrx="(props.row.contract) ? true : false" )
            q-td( key="value" :props="props")
                span(v-if="props.row.value > 0 ||  !props.row.transfer ") {{ props.row.value }} TLOS
                div(v-else)
                    span(v-if="props.row.transfer") {{ props.row.transfer.value }} {{ props.row.transfer.symbol }}
</template>
