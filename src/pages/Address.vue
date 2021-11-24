<template lang="pug">
  .q-px-xl
    div()
      h6() {{ isContract ? "Contract" : "Account" }}: {{ address }}
      h6(v-if="!!telosAccount") {{ `Native account: ` }}
        a(:href="getAddressBloksURL()" target="_blank") {{ telosAccount }}
      h6(v-if="!!balance" ) Balance: {{balance}}
    transaction-table( :title="address" :filter="{address}" )
</template>

<script>
import TransactionTable from "components/TransactionTable";
import Web3 from "web3";

const web3 = new Web3();
export default {
  name: "Address",
  components: { TransactionTable },
  data() {
    return {
      address: this.$route.params.address,
      telosAccount: null,
      balance: null,
      isContract: false
    }
  },
  mounted() {
    this.loadAccount();
  },
  methods: {
    async loadAccount() {
      const account = await this.$evm.telos.getEthAccount(this.address);
      let strBalance = web3.utils.fromWei(account.balance);
      strBalance = `${strBalance.substring(0, (strBalance.indexOf('.') + 5))} TLOS`;
      this.balance = strBalance;
      this.telosAccount = account.account;
      this.isContract = account.code.length > 0;
    },
    getAddressBloksURL() {
      if (!this.telosAccount)
        return '';

      return `${process.env.NETWORK_EXPLORER}/account/${this.telosAccount}`
    }
  }
}
</script>

<style scoped>

</style>
