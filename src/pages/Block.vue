<template lang="pug">
  .q-px-xl
    div()
      h4() Block: {{block}}
      div(v-if="blockData")
        div()
          strong()
            date-field( :epoch="blockData.timestamp" )
        div() Transactions: {{ blockData.transactions.length || 0 }}
        div() Gas used: {{ parseInt(blockData.gasUsed, 16) }}
        //div() {{ blockData }}
    transaction-table( :title="block" :filter="{block}" )
</template>

<script>
import TransactionTable from "components/TransactionTable";
import DateField from "components/DateField";
import { mapActions } from "vuex";

export default {
  name: "Block",
  components: { DateField, TransactionTable },
  data() {
    return {
      block: this.$route.params.block,
      blockData: null
    }
  },
  mounted() {
    this.loadBlock();
  },
  methods: {
    ...mapActions("evm", ["doRPC"]),
    async loadBlock() {
      const blockResponse = await this.doRPC({
        method: 'eth_getBlockByNumber',
        params: [parseInt(this.block).toString(16), false]
      });
      this.blockData = blockResponse.result;
    }
  }

}
</script>

<style scoped>

</style>
