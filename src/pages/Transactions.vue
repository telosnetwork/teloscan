<template>
  <q-page class="column justify-center items-center">

    <div class="row q-pa-lg">
      <div class="text-h4">
        Explore Transactions
      </div>
    </div>

    <div class="row">
      <div class="col-12 q-px-sm">
        <transaction-table title="Recent transactions"></transaction-table>
      </div>
    </div>

  </q-page>
</template>

<script>
import Search from 'components/Search'
import TransactionTable from "components/TransactionTable";
import HomeInfo from "components/HomeInfo.vue";
export default {
  components: { 
    TransactionTable
  },
  name: "Index"
};
</script>
