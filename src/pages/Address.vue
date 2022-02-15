<template lang="pug">
  .pageContainer.q-pt-xl
    div()
      .row(class="tableWrapper").justify-between
        div(class="homeInfo")
          .text-primary.text-h4 {{ getTitle() }}
          q-icon.cursor(v-if='isContract && isVerified !== null' :name="isVerified ? 'verified' : 'warning'" :class="isVerified ? 'text-green' : 'text-red'" size='1.25rem' @click='confirmationDialog = true')
          ConfirmationDialog(:flag='confirmationDialog' :address='address' :status="isVerified" @dialog='disableConfirmation')
          .text-white {{ address }}
        .dataCardsContainer()
          .dataCardItem(v-if="!!telosAccount")
            .dataCardTile Native account
            .dataCardData
              a(:href="getAddressBloksURL()" target="_blank") {{ telosAccount }}
          .dataCardItem(v-if="!!balance" class="balance ")
            .dataCardTile Balance
            .dataCardData {{balance}}
      q-tabs( v-model="tab" dense active-color="secondary"  align="justify" narrow-indicator class="tabsBar content-container text-white tableWrapper" )
        q-route-tab(name="transactions" :to="{ hash: '' }" exact replace label="Transactions")
        q-route-tab(name="erc20transfers" :to="{ hash: 'erc20' }" exact replace label="ERC20 Transfers")
        q-route-tab(name="tokens" :to="{ hash: 'tokens' }" exact replace label="Tokens")
        q-route-tab(v-if="isContract" name="contract" :to="{ hash: 'contract' }" exact replace label="Contract")
      .q-mb-md.tableWrapper
        q-tab-panels( v-model="tab" animated keep-alive class="shadow-2 content-container" )
          q-tab-panel( name="transactions" )
            transaction-table( :title="address" :filter="{address}" )
          q-tab-panel( name="erc20transfers" )
            transfer-table( title="ERC-20 Transfers" token-type="erc20" :address="address" )
          q-tab-panel( name="tokens" )
            token-list( :address="address" )
          q-tab-panel( v-if="isContract" name="contract" )
            ContractSource(v-if='isVerified')
            .verify-source(v-else)
              q-icon( name='warning' class='text-red' size='1.25rem')
              | This contract source has not been verified. <br/>
              | Click&nbsp
              router-link( :to="{name: 'sourcify'}") here
              | &nbspto upload source files and verify this contract.
</template>

<script>
import Web3 from "web3";
import TransactionTable from "components/TransactionTable";
import TransferTable from "components/TransferTable";
import TokenList from "components/TokenList";
import ConfirmationDialog from "components/ConfirmationDialog";
import ContractSource from 'components/ContractSource';

const web3 = new Web3();
export default {
  name: "Address",
  components: { TokenList, TransactionTable, TransferTable, ConfirmationDialog, ContractSource },
  data() {
    return {
      address: this.$route.params.address,
      telosAccount: null,
      balance: null,
      isContract: false,
      isVerified: null,
      contract: null,
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
        this.contract = await this.$contractManager.getContract(this.address)
        this.isVerified = this.contract.verified;
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
    getTitle() {
      if (this.isContract) {
        let name = this.contract.getName();
        if (!name || name.startsWith('0x'))
          return 'Contract';

        return name;
      }

      return 'Account';
    },
    getAddressBloksURL() {
      if (!this.telosAccount) return "";

      return `${process.env.NETWORK_EXPLORER}/account/${this.telosAccount}`;
    },
    disableConfirmation(){
      this.confirmationDialog = false;
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

.cursor
  cursor: pointer

.text-primary
  display: inline-block

.verify-source
  height: 25rem
  line-height: 2rem
  margin-left: 2rem
  padding-top: 10rem
</style>
