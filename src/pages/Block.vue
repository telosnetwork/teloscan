<template lang="pug">
  .pageContainer.q-pt-xl
    div()
      .row.justify-between
        div()
          .text-primary.text-h4
            div() Block
          .text-white 
            div() {{block}}
        .dataCardsContainer(v-if="blockData")
          .dataCardItem() 
            .dataCardTile Gas used
            .dataCardData {{ parseInt(blockData.gasUsed, 16) }}
          .dataCardItem()
            .dataCardTile Transactions 
            .dataCardData {{ blockData.transactions.length || 0 }}
          .dataCardItem()
            .dataCardTile 
              date-field( :epoch="blockData.timestamp" )
          //div() {{ blockData }}
    .tableWrapper(class="shadow-2 content-container q-mt-lg") 
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
    };
  },
  mounted() {
    this.loadBlock();
  },
  methods: {
    ...mapActions("evm", ["doRPC"]),
    async loadBlock() {
      const blockResponse = await this.doRPC({
        method: "eth_getBlockByNumber",
        params: [parseInt(this.block).toString(16), false]
      });
      this.blockData = blockResponse.result;
    }
  }
};
</script>

<style scoped></style>
