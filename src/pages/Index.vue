<template>
  <q-page class="pageContainer">
    <div class="row justify-center q-py-lg">
      <div class="text-h4 text-primary">
        Telos EVM Explorer
      </div>
    </div>

    <div class="row q-pt-xl q-pb-md">
      <div class="col-sm-12 col-md-10 offset-md-1 ">
        <home-info />
      </div>
    </div>

    <!-- <div class="row fit q-px-sm">
      <div class="col-xs-12 col-md-6 offset-md-3 q-px-sm">
        <q-card class="searchCard">
          <q-card-section class="q-pa-lg searchCardSection">
            <search />
          </q-card-section>
        </q-card>
      </div>
    </div> -->

    <div class="row">
      <div class="col-12  tableWrapper">
        <q-card class="q-mx-md q-px-md ">
          <search />
        </q-card>
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

<style lang="scss" scoped></style>
