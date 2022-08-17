<script>
import Web3 from 'web3';
import TransactionTable from 'components/TransactionTable';
import TransferTable from 'components/TransferTable';
import TokenList from 'components/TokenList';
import ConfirmationDialog from 'components/ConfirmationDialog';
import ContractTab from 'components/ContractTab/ContractTab';
import TransactionField from 'components/TransactionField';
import AddressField from 'components/AddressField';
import CopyButton from 'components/CopyButton';
import GenericContractInterface from 'components/ContractTab/GenericContractInterface.vue';

const web3 = new Web3();
export default {
    name: 'Address',
    components: {
        AddressField,
        ConfirmationDialog,
        ContractTab,
        CopyButton,
        GenericContractInterface,
        TokenList,
        TransactionField,
        TransactionTable,
        TransferTable,
    },
    data() {
        return {
            title: '',
            telosAccount: null,
            balance: null,
            isContract: false,
            isVerified: null,
            contract: null,
            verificationDate: '',
            tab: 'transactions',
            tokens: null,
            confirmationDialog: false,
        };
    },
    computed: {
        address() {
            return this.$route.params?.address?.toLowerCase() ?? '';
        },
    },
    watch: {
        'address': {
            handler(newValue, oldValue) {
                if (newValue !== oldValue) {
                    this.loadAccount();
                }
            },
            immediate: true,
        },
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

            const isVerifiedContract = this.isContract && this.isVerified;
            const knownToken = this.$contractManager.tokenList.tokens.find(({ address }) => address.toLowerCase() === this.address.toLowerCase());

            if (knownToken?.name) {
                this.title = knownToken.name;
            } else if (isVerifiedContract) {
                this.title = this.contract.getName();
            } else if (this.isContract) {
                this.title = 'Contract';
            } else {
                this.title = 'Account';
            }
        },
        getBalanceDisplay(balance) {
            let strBalance = web3.utils.fromWei(balance);
            const decimalIndex = strBalance.indexOf('.');
            if (decimalIndex > 0) {
                strBalance = `${strBalance.substring(
                    0,
                    decimalIndex + 5,
                )}`;
            }
            return `${strBalance} TLOS`;
        },
        getAddressNativeExplorerURL() {
            if (!this.telosAccount) return '';

            return `${process.env.NETWORK_EXPLORER}/account/${this.telosAccount}`;
        },
        disableConfirmation(){
            this.confirmationDialog = false;
        },
    },
};
</script>

<template lang="pug">
  .pageContainer.q-pt-xl
    div
      .row(class="tableWrapper").justify-between.q-mb-lg
        div(class="homeInfo")
          .text-primary.text-h4.q-pr-xs {{ title }}
          q-icon.cursor(v-if='isContract && isVerified !== null' :name="isVerified ? 'verified' : 'warning'" :class="isVerified ? 'text-green' : 'text-red'" size='1.25rem' @click='confirmationDialog = true')
          ConfirmationDialog(:flag='confirmationDialog' :address='address' :status="isVerified" @dialog='disableConfirmation')
          CopyButton(:text="address" :accompanyingText="address" description="address")
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
      q-tabs.tabs-header( v-model="tab" dense active-color="secondary"  align="justify" narrow-indicator class="tabsBar topRounded text-white tableWrapper" :class='{"q-dark": $q.dark.isActive}' )
        q-route-tab(name="transactions" :to="{ hash: '' }" exact replace label="Transactions")
        q-route-tab(name="erc20transfers" :to="{ hash: 'erc20' }" exact replace label="ERC20 Transfers")
        q-route-tab(name="erc721transfers" :to="{ hash: 'erc721' }" exact replace label="ERC721 Transfers")
        q-route-tab(name="tokens" :to="{ hash: 'tokens' }" exact replace label="Tokens")
        q-route-tab(v-if="isContract" name="contract" :to="{ hash: 'contract' }" exact replace label="Contract")
      .q-mb-md.tableWrapper
        q-tab-panels( v-model="tab" animated keep-alive class="shadow-2" )
          q-tab-panel( name="transactions" )
            transaction-table( :key="address" :title="address" :filter="{address}" )
          q-tab-panel( name="erc20transfers" )
            transfer-table( title="ERC-20 Transfers" token-type="erc20" :address="address" )
          q-tab-panel( name="erc721transfers" )
            transfer-table( title="ERC-721 Transfers" token-type="erc721" :address="address" )
          q-tab-panel( name="tokens" )
            token-list( :address="address" )
          q-tab-panel( v-if="isContract" name="contract" )
            ContractTab(v-if='isVerified' :contract="contract")
            GenericContractInterface(v-else)
</template>

<style scoped lang="sass">
.dataCardsContainer .dataCardItem       
  width: fit-content
  height: 5rem

.q-tab-panel
  padding: 0

.q-icon
  padding-bottom: .75rem

.cursor
  cursor: pointer

.tabs-header
  background: white
  color: black !important
  &.q-dark
    background: var(--q-color-dark)
    color: white !important

.text-primary
  display: inline-block
</style>
