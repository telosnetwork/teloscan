<template lang="pug">
  .q-px-xl
    div()
      h4() Block: {{block}}
    transaction-table( :title="block" :filter="{block}" )
</template>

<script>
import TransactionTable from "components/TransactionTable";

export default {
  name: "Block",
  components: { TransactionTable },
  data() {
    return {
      block: this.$route.params.block
    }
  }

}
</script>

<style scoped>

</style>
