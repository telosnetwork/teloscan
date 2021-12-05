<template lang="pug">
  div(v-if="trx.parsedTransaction" )
    div() {{ trx.parsedTransaction.name.length > 8 && shorten ? `${trx.parsedTransaction.name.slice(0,8)}...` : trx.parsedTransaction.name  }}
    div() {{ transferAmount }}
    q-tooltip(v-if="shorten" anchor="center middle" self="center middle")
      | {{ trx.parsedTransaction.name }}
  div(v-else)
    div() {{trx.input_data.length > 8 && shorten ? `${trx.input_data.slice(0,8)}...` : trx.input_data}}
    q-tooltip( v-if="shorten" anchor="center middle" self="center middle")
      | {{ trx.input_data.slice(0,8) }}
</template>

<script>

import { formatBN } from "src/lib/utils";
import {BigNumber} from "ethers";

const ERC20_SIGHASH = '0xa9059cbb';

export default {
  name: "MethodField",
  props: {
    trx: {
      type: Object
    },
    contract: {
      type: Object
    },
    shorten: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      transferAmount: null,
      transferTo: null
    }
  },
  mounted() {
    this.setValues();
  },
  methods: {
    async setValues() {
      if (!this.trx.parsedTransaction)
        return;

      if (this.trx.parsedTransaction.sighash === ERC20_SIGHASH && this.contract) {
        const amount = BigNumber.from(this.trx.parsedTransaction.args["amount"]);
        this.transferAmount = `${formatBN(this.trx.parsedTransaction.args["amount"], this.contract.token.decimals, 5)} ${this.contract.token.symbol}`;
      }
    }
  }
}
</script>

<style scoped>

</style>
