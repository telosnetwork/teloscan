<template lang="pug">
  .q-px-xl
    div()
      h6() {{ isContract ? "Contract" : "Account" }}: {{ address }}
      h6(v-if="!!telosAccount") {{ `Native account: ` }}
        a(:href="getAddressBloksURL()" target="_blank") {{ telosAccount }}
      h6(v-if="!!balance" ) Balance: {{balance}}
      q-tabs( v-model="tab" dense active-color="primary" inactive-color="secondary" align="justify" narrow-indicator )
        q-route-tab(name="transactions" :to="{ hash: '' }" exact replace label="Transactions")
        q-route-tab(name="tokens" :to="{ hash: 'tokens' }" exact replace label="Tokens")
      q-separator()
      q-tab-panels( v-model="tab" animated keep-alive )
        q-tab-panel( name="transactions" )
          transaction-table( :title="address" :filter="{address}" )
        q-tab-panel( name="tokens" )
          token-list( :address="address" )
</template>

<script>
import TransactionTable from "components/TransactionTable";
import TokenList from "components/TokenList";
import Web3 from "web3";

const web3 = new Web3();
export default {
  name: "Address",
  components: {TokenList, TransactionTable },
  data() {
    return {
      address: this.$route.params.address,
      telosAccount: null,
      balance: null,
      isContract: false,
      tab: 'transactions',
      tokens: null
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
  },
  watch: {
    $route(to, from) {
      this.loadAccount();
    }
  }
}
</script>

<style scoped>

</style>
