<template>
  <q-page class="column justify-center items-center">
    <img class="logo" alt="Telos logo" src="~assets/telos-logo-full.png" />
    <search></search>
    <transaction-table title="Recent transactions"></transaction-table>
  </q-page>
</template>

<script>
import Search from 'components/Search'
import TransactionTable from "components/TransactionTable";
// TODO: should search when someone presses enter
export default {
  components: { TransactionTable, Search },
  name: "Index"
};
</script>

<style lang="sass" scoped>
.logo
  max-width: 400px

.description
  max-width: 800px
</style>
