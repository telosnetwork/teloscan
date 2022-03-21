<template lang="pug">
  .pageContainer.q-pt-xl
    div()
      .row(class="tableWrapper").justify-between
        div(class="homeInfo")
          .text-primary.text-h4 {{ getTitle() }}
          q-icon.cursor(v-if='isContract && isVerified !== null' :name="isVerified ? 'verified' : 'warning'" :class="isVerified ? 'text-green' : 'text-red'" size='1.25rem' @click='confirmationDialog = true')
          ConfirmationDialog(:flag='confirmationDialog' :address='address' :status="isVerified" @dialog='disableConfirmation')
          .text-white {{ address }}
          span(v-if='contract')
            .text-white Created at trx&nbsp
              TransactionField(:transaction-hash="contract.getCreationTrx()" )
            .text-white by address&nbsp
              AddressField(:address="contract.getCreator()")
        .dataCardsContainer()
          .dataCardItem(v-if="!!telosAccount")
            .dataCardTile Native account
            .dataCardData
              a(:href="getAddressNativeExplorerURL()" target="_blank") {{ telosAccount }}
          .dataCardItem(v-if="!!balance" class="balance ")
            .dataCardTile Balance
            .dataCardData {{balance}}
      q-tabs.q-dark( v-model="tab" dense active-color="secondary"  align="justify" narrow-indicator class="tabsBar content-container text-white tableWrapper" )
        q-route-tab(name="transactions" :to="{ hash: '' }" exact replace label="Transactions")
        q-route-tab(name="erc20transfers" :to="{ hash: 'erc20' }" exact replace label="ERC20 Transfers")
        q-route-tab(name="erc721transfers" :to="{ hash: 'erc721' }" exact replace label="ERC721 Transfers")
        q-route-tab(name="tokens" :to="{ hash: 'tokens' }" exact replace label="Tokens")
        q-route-tab(v-if="isContract" name="contract" :to="{ hash: 'contract' }" exact replace label="Contract")
      .q-mb-md.tableWrapper
        q-tab-panels( v-model="tab" animated keep-alive class="shadow-2 content-container" )
          q-tab-panel( name="transactions" )
            transaction-table( :key="address" :title="address" :filter="{address}" )
          q-tab-panel( name="erc20transfers" )
            transfer-table( title="ERC-20 Transfers" token-type="erc20" :address="address" )
          q-tab-panel( name="erc721transfers" )
            transfer-table( title="ERC-721 Transfers" token-type="erc721" :address="address" )
          q-tab-panel( name="tokens" )
            token-list( :address="address" )
          q-tab-panel( v-if="isContract" name="contract" )
            ContractTab(v-if='isVerified')
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
import ContractTab from 'components/ContractTab/ContractTab';
import TransactionField from "components/TransactionField";
import AddressField from "components/AddressField";

const web3 = new Web3();
export default {
  name: "Address",
  components: {
    AddressField,
    TransactionField, TokenList, TransactionTable, TransferTable, ConfirmationDialog, ContractTab },
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

      this.balance = this.getBalanceDisplay(account.balance);
      this.telosAccount = account.account;
      this.isContract = account.code.length > 0;
    },
    getBalanceDisplay(balance) {
      let strBalance = web3.utils.fromWei(balance);
      const decimalIndex = strBalance.indexOf(".");
      if (decimalIndex > 0) {
        strBalance = `${strBalance.substring(
          0,
          strBalance.indexOf(".") + 5
        )}`;
      }
      return `${strBalance} TLOS`;
    },
    getTitle() {
      if (this.isContract) {
        if (this.isVerified){
          return this.contract.getName();
        }
        return 'Contract';
      }

      return 'Account';
    },
    getAddressNativeExplorerURL() {
      if (!this.telosAccount) return "";

      return `${process.env.NETWORK_EXPLORER}/account/${this.telosAccount}`;
    },
    disableConfirmation(){
      this.confirmationDialog = false;
    }
  },
  watch: {
    '$route.params': {
      handler(newValue) {
        const { address } = newValue
        if (this.address === address) {
          return;
        }

        this.address = address;
        this.loadAccount();
      },
      immediate: true,
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
