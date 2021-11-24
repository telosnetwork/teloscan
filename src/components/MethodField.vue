<template lang="pug">
  div(v-if="trx.parsedTransaction" )
    div() {{ trx.parsedTransaction.name }}
      div() {{ transferAmount }}
</template>

<script>

import BN from 'bn.js';
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

      if (this.trx.parsedTransaction.sighash === ERC20_SIGHASH) {
        const amount = BigNumber.from(this.trx.parsedTransaction.args["amount"]);
        this.transferAmount = `${(amount / Math.pow(10, this.contract.token.decimals)).toFixed(5)} ${this.contract.token.symbol}`;
      }
    }
  }
}
</script>

<style scoped>

</style>
