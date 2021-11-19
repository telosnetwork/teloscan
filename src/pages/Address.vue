<template>
  <div>
    <h4>
      {{address}}
    </h4>
    <TransactionTable :title="address" :filter="{address}"></TransactionTable>
  </div>
</template>

<script>
import TransactionTable from "components/TransactionTable";

export default {
  name: "Address",
  components: { TransactionTable },
  data() {
    return {
      address: this.$route.params.address
    }
  }

}
</script>

<style scoped>

</style>
