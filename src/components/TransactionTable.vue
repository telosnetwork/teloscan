<script>
import AddressField from 'components/AddressField';
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import MethodField from 'components/MethodField';

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
        label: 'Value',
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
                    if (transaction.input_data === '0x') continue;

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
                } catch (e) {
                    console.error(
                        `Failed to parse data for transaction, error was: ${e.message}`,
                    );
                }
            }
            this.setRows(page, rowsPerPage);
            this.loading = false;
        },
        setRows() {
            // TODO: do this differently?
            this.rows = this.transactions;
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
  :data="rows"
  :columns="columns"
  :pagination.sync="pagination"
  :loading="loading"
  @request="onRequest"
  :rows-per-page-options="[10, 20, 50]"
  flat
)
  q-tr( slot="header" slot-scope="props", :props="props" )
    q-th(
      v-for="col in props.cols"
      :key="col.name"
      :props="props"
      @click="col.name==='date' ? showAge=!showAge : null"
    )
      template(
        v-if="col.name==='date'"
        class=""
      )
        q-tooltip(anchor="bottom middle" self="bottom middle") Click to change format
      | {{ col.label }}
      template(
        v-if="col.name==='method'"
        )
        q-icon(name="fas fa-info-circle")
          q-tooltip(anchor="bottom middle" self="top middle" max-width="10rem") Function executed based on decoded input data. For unidentified function, method ID is displayed instead.

  q-tr( slot="body" slot-scope="props" :props="props" )
    q-td( key="hash" )
      transaction-field( :transaction-hash="props.row.hash" )
    q-td( key="block" )
      block-field( :block="props.row.block" )
    q-td( key="date" )
      date-field( :epoch="props.row.epoch", :showAge="showAge" )
    q-td( key="method" )
      method-field( v-if="props.row.parsedTransaction" :trx="props.row" :shorten="true" )
    q-td( key="from" )
      address-field( :address="props.row.from" )
    q-td( key="to" )
      address-field( :address="props.row.to" :is-contract-trx="props.row.input_data !== '0x'" )
    q-td( key="value" ) {{ (props.row.value / 1000000000000000000).toFixed(5) }} TLOS
</template>
