<template lang="pug">
  .q-pa-md
    q-table(
      :data="rows"
      :columns="columns"
      :pagination.sync="pagination"
      :loading="loading"
      @request="onRequest"
    )
      q-tr( slot="body" slot-scope="props" :props="props" )
        q-td( key="hash" )
          transaction-field( :transaction-hash="props.row.hash" )
        q-td( key="block" )
          block-field( :block="props.row.block" )
        q-td( key="date" )
          date-field( :epoch="props.row.epoch" )
        q-td( key="from" )
          address-field( :address="props.row.from" )
        q-td( key="to" )
          address-field( :address="props.row.to" )
        q-td( key="value" ) {{ (props.row.value / 1000000000000000000).toFixed(5) }} TLOS
</template>

<script>
import AddressField from "components/AddressField";
import BlockField from "components/BlockField";
import DateField from "components/DateField";
import TransactionField from "components/TransactionField";

const columns = [
  {
    name: 'hash',
    label: 'TX Hash',
    align: 'left'
  },{
    name: 'block',
    label: 'Block',
    align: 'left'
  },{
    name: 'date',
    label: 'Date',
    align: 'left'
  },{
    name: 'from',
    label: 'From',
    align: 'left'
  },{
    name: 'to',
    label: 'To',
    align: 'left'
  },{
    name: 'value',
    label: 'Value',
    align: 'left'
  },
]


export default {
  name: "TransactionTable",
  components: {TransactionField, DateField, BlockField, AddressField },
  props: {
    title: {
      type: String,
      required: true
    },
    filter: {
      type: Object
    },
    initialPageSize: {
      type: Number
    }
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
        rowsNumber: 0
      }
    }
  },
  mounted() {
    this.onRequest({
      pagination: this.pagination
    })
  },
  methods: {
    async onRequest(props) {
      this.loading = true;

      const { page, rowsPerPage, sortBy, descending } = props.pagination

      let result = await this.$evmEndpoint.get(this.getPath(props))
      if (this.total == null)
        this.pagination.rowsNumber = result.data.total.value;

      this.pagination.page = page
      this.pagination.rowsPerPage = rowsPerPage
      this.pagination.sortBy = sortBy
      this.pagination.descending = descending

      // TODO: some better logic here, if you change from 10 to 50 per page, it ends up with a messed up order...
      //  like we append/push when we should be replacing here
      //  maybe need to use a map for transactions to ensure they're unique and then sort them in setRows?
      this.transactions.push(...result.data.transactions);
      console.dir(props);
      this.setRows(page, rowsPerPage);
      this.loading = false;
    },
    setRows(page, rowsPerPage) {
      // TODO: make it work when you click directly to last page, sometimes it goes to an empty page
      if (page == Math.floor(this.pagination.rowsNumber / rowsPerPage)) {
        const start = (page - 1) * rowsPerPage;
        this.rows = this.transactions.slice(start, this.pagination.rowsNumber);
      } else {
        const start = (page - 1) * rowsPerPage;
        this.rows = this.transactions.slice(start, start + rowsPerPage);
      }
    },
    getPath(props) {
      const { page, rowsPerPage, descending } = props.pagination
      let path = `/v2/evm/get_transactions?limit=${rowsPerPage === 0 ? 500 : rowsPerPage}`
      if (this.filter.address)
        path += `&address=${this.filter.address}`

      path += `&skip=${(page - 1) * rowsPerPage}`;
      path += `&sort=${descending ? 'desc' : 'asc'}`;

      return path;
    }
  }

}
</script>

<style scoped>

</style>
