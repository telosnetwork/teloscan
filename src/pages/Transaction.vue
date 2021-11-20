<template lang="pug">
  .q-px-xl
    div()
      h6() Transaction Hash: {{hash}}
    div(v-if="trx")
        q-tabs( v-model="tab" dense active-color="primary" inactive-color="secondary" align="justify" narrow-indicator )
          q-tab(name="general" label="General")
          q-tab(name="details" label="Details")
          q-tab(name="logs" label="Logs")
          q-tab(name="internal" label="Internal")
        q-separator()
        q-tab-panels( v-model="tab" animated )
          q-tab-panel( name="general" )
            div()
              strong() {{ `Block Number: ` }}
              block-field( :block="trx.block" )
            br()
            div()
              strong() {{ `Transaction index: ` }}
              span() {{ trx.trx_index }}
            br()
            div()
              strong() {{ `Status: ` }}
              span() {{ trx.status == 1 ? 'Success' : 'Failure' }}
            br()
            div()
              strong() {{ `From: ` }}
              address-field( :address="trx.from" :truncate=0 )
            br()
            div()
              strong() {{ `To: ` }}
              address-field( :address="trx.to" :truncate=0 )
            br()
            div(v-if="trx.createdaddress")
              strong() {{ `Deployed contract: ` }}
              span() {{ (trx.value / 1000000000000000000).toFixed(5) }} TLOS
              br()
            div()
              strong() {{ `Value: ` }}
              span() {{ (trx.value / 1000000000000000000).toFixed(5) }} TLOS
            br()
            div()
              strong() {{ `Gas Price Charged: ` }}
              span() {{ getGasChargedGWEI() }} GWEI
            br()
            div()
              strong() {{ `Gas Fee: ` }}
              span() {{ getGasFee() }} TLOS
            br()
            div()
              strong() {{ `Gas Used: ` }}
              span() {{ trx.gasused }}
            br()
            div()
              strong() {{ `Gas Limit: ` }}
              span() {{ trx.gas_limit }}
            br()
            div()
              strong() {{ `Nonce: ` }}
              span() {{ trx.nonce }}
          q-tab-panel( name="details" )
            div()
              strong() {{ `Input: ` }}
              span() {{ trx.input_data }}
            br()
            div()
              strong() {{ `Output: ` }}
              span() {{ trx.output }}
          q-tab-panel( name="logs" )
            pre()
              div() {{ JSON.stringify(trx.logs, null, 4) }}
          q-tab-panel( name="internal" )
            pre()
              div() {{ JSON.stringify(trx.itxs, null, 4) }}

</template>

<script>
import DateField from "components/DateField";
import BlockField from "components/BlockField";
import AddressField from "components/AddressField";

export default {
  name: "Transaction",
  components: {AddressField, BlockField, DateField },
  data() {
    return {
      hash: this.$route.params.hash,
      blockData: null,
      trxNotFound: false,
      trx: null,
      tab: 'general'
    }
  },
  mounted() {
    this.loadTransaction();
  },
  methods: {
    async loadTransaction() {
      const trxResponse = await this.$evmEndpoint.get(`/v2/evm/get_transactions?hash=${this.hash}`)
      if (trxResponse.data.transactions.length < 1) {
        this.trxNotFound = true;
        return;
      }

      this.trx = trxResponse.data.transactions[0];
    },
    getGasFee() {
      return ((this.trx.charged_gas_price * this.trx.gasused) / 1000000000000000000).toFixed(5);
    },
    getGasChargedGWEI() {
      return (this.trx.charged_gas_price  / 1000000000).toFixed(2);
    }
  }
}
</script>

<style scoped>

</style>
