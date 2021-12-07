<template>
  <q-page class="column items-center">
    <div class="row q-pa-lg">
      <div class="text-h4 text-primary">
        Telos EVM Explorer
      </div>
    </div>

    <div class="row q-pt-xl q-pb-md">
      <div class="col-sm-12 col-md-10 offset-md-1 ">
        <home-info/>
      </div>
    </div> 

    <div class="row fit">
      <div class="col-xs-12 col-md-6 offset-md-3 q-px-sm">
        <q-card class="searchCard">
          <q-card-section class="q-pa-lg searchCardSection">
            <search />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="column">
      <div class="col-12  tableWrapper">
        <transaction-table title="Recent transactions"></transaction-table>
      </div>
    </div>
  </q-page>
</template>

<script>
import Search from "components/Search";
import TransactionTable from "components/TransactionTable";
import HomeInfo from "components/HomeInfo.vue";
export default {
  components: {
    Search,
     HomeInfo,
    TransactionTable
  },
  name: "Index"
};
</script>

<style lang="scss" scoped>
.tableWrapper {
  max-width: 100vw;
}
</style>
