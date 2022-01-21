<template lang="pug">
  .pageContainer.q-pt-xl
    div()
      .row(class="tableWrapper").justify-between
        div(class="homeInfo")
          .text-primary.text-h4( v-if='!isContract') Account   
          .text-primary.text-h4( v-else ) Contract  
          q-icon(:name="isVerified ? 'verified' : 'warning'" :class="isVerified ? 'text-green' : 'text-red'" size='1.25rem' @click='confirmationDialog = true')
          ConfirmationDialog(:flag='confirmationDialog' :address='address' :status="isVerified" :date="verificationDate" @dialog='confirmationDialog = false')
          .text-white {{ address }}
        .dataCardsContainer()
          .dataCardItem(v-if="!!telosAccount") 
            .dataCardTile Native account
            .dataCardData  
              a(:href="getAddressBloksURL()" target="_blank") {{ telosAccount }}
          .dataCardItem(v-if="!!balance" class="balance ")
            .dataCardTile Balance 
            .dataCardData {{balance}}
      q-tabs( v-model="tab" dense active-color="secondary"  align="justify" narrow-indicator class="tabsBar ContentContainer text-white tableWrapper" )
        q-route-tab(name="transactions" :to="{ hash: '' }" exact replace label="Transactions")
        q-route-tab(name="tokens" :to="{ hash: 'tokens' }" exact replace label="Tokens")
      .q-mb-md.tableWrapper
        q-tab-panels( v-model="tab" animated keep-alive class="shadow-2 ContentContainer" )
          q-tab-panel( name="transactions" )
            transaction-table( :title="address" :filter="{address}" )
          q-tab-panel( name="tokens" )
            token-list( :address="address" )
</template>

<script>
import TransactionTable from "components/TransactionTable";
import TokenList from "components/TokenList";
import ConfirmationDialog from "components/ConfirmationDialog";
import Web3 from "web3";

const web3 = new Web3();
export default {
  name: "Address",
  components: { TokenList, TransactionTable, ConfirmationDialog },
  data() {
    return {
      address: this.$route.params.address,
      telosAccount: null,
      balance: null,
      isContract: false,
      isVerified: false,
      verificationDate: '',
      tab: "transactions",
      tokens: null,
      confirmationDialog: false
    };
  },
  mounted() {
    this.loadAccount();
  },
  methods: {
    async loadAccount() {
      const account = await this.$evm.telos.getEthAccount(this.address);
      if (account.code.length > 0){
        this.isContract = true;
        const response = await this.$telosApi.get(`contracts/status?contractAddress=${this.address}`);
        if (response.data.status) {
          debugger;
          this.isVerified = true;
          this.verificationDate = response.data.message;
        }
      }
      let strBalance = web3.utils.fromWei(account.balance);
      strBalance = `${strBalance.substring(
        0,
        strBalance.indexOf(".") + 5
      )} TLOS`;
      this.balance = strBalance;
      this.telosAccount = account.account;
      this.isContract = account.code.length > 0;
    },
    getAddressBloksURL() {
      if (!this.telosAccount) return "";

      return `${process.env.NETWORK_EXPLORER}/account/${this.telosAccount}`;
    }
  },
  watch: {
    $route(to, from) {
      this.loadAccount();
    }
  }
};
</script>

<style scoped lang="sass">
.q-tab-panel 
  padding: 0

.q-icon
  padding-bottom: .75rem

.text-primary
  display: inline-block
</style>
