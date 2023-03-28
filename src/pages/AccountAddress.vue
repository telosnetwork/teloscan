<!-- eslint-disable vue/no-unused-components -->
<script>
import { toChecksumAddress } from 'src/lib/utils';
import { getIcon } from 'src/lib/token-utils';
import Web3 from 'web3';
import TransactionTable from 'components/TransactionTable';
import InternalTransactionTable from 'components/InternalTransactionTable';
import TransferTable from 'components/TransferTable';
import TokenList from 'components/TokenList';
import ConfirmationDialog from 'components/ConfirmationDialog';
import ContractTab from 'components/ContractTab/ContractTab';
import TransactionField from 'components/TransactionField';
import AddressField from 'components/AddressField';
import CopyButton from 'components/CopyButton';
import GenericContractInterface from 'components/ContractTab/GenericContractInterface.vue';
import DateField from 'components/DateField';

const web3 = new Web3();

const tabs = {
    transactions: '#transactions',
    int_transactions: '#int_transactions',
    erc20_transfers: '#erc20',
    erc721_transfers: '#erc721',
    erc1155_transfers: '#erc1155',
    tokens: '#tokens',
    contract: '#contract',
};

export default {
    name: 'AccountAddress',
    components: {
        AddressField,
        ConfirmationDialog,
        ContractTab,
        CopyButton,
        GenericContractInterface,
        TokenList,
        TransactionField,
        DateField,
        TransactionTable,
        InternalTransactionTable,
        TransferTable,
    },
    data() {
        return {
            accountLoading: false,
            title: '',
            telosAccount: null,
            balance: null,
            nonce: null,
            isContract: false,
            contract: null,
            verificationDate: '',
            creationDate: 0,
            tab: '#transactions',
            tokens: null,
            confirmationDialog: false,
        };
    },
    computed: {
        address() {
            return this.$route.params?.address ?? '';
        },
    },
    watch: {
        address: {
            handler(newValue, oldValue) {
                if (newValue !== oldValue) {
                    const newAsChecksum = toChecksumAddress(newValue);
                    if (newAsChecksum !== newValue) {
                        this.$router.replace({ params: { address: newAsChecksum } });
                    }
                    this.loadAccount();
                }
            },
            immediate: true,
        },
        $route: {
            immediate: true,
            deep: true,
            async handler(newRoute, oldRoute = {}) {
                if (newRoute !== oldRoute) {
                    const { hash: newHash } = newRoute;

                    if (newRoute.name !== 'address' || !newHash) {
                        return;
                    }

                    if (this.accountLoading && newHash === tabs.contract) {
                        // wait for account to load; this.isContract will not be set immediately on first load
                        await new Promise(resolve => setTimeout(resolve, 750));
                    }

                    const tabHashes = Object.values(tabs);
                    const newHashIsInvalid =
                        !tabHashes.includes(newHash) ||
                        (newHash === tabs.contract && !this.isContract);

                    if (newHashIsInvalid) {
                        this.$router.replace({ hash: tabs.transactions });
                    }
                }
            },
        },
    },
    created() {
        this.loadAccount();
    },
    methods: {
        async loadAccount() {
            this.accountLoading = true;
            this.isContract = false;
            const tokenList = await this.$contractManager.getTokenList();
            const account = await this.$evm.telos.getEthAccount(this.address);
            this.contract = null;
            this.nonce = account.nonce;
            this.title = this.$t('pages.account');
            if (account.code.length > 0){
                this.contract = await this.$contractManager.getContract(this.address);
                if(this.contract){
                    tokenList.tokens.forEach((token) => {
                        if(token.address.toLowerCase() ===  this.contract.address.toLowerCase()){
                            this.contract.logoURI = token.logoURI;
                            this.contract.setVerified(true);
                        }
                    });
                    this.isContract = true;
                    const response = await this.$indexerApi.get(`/block/${this.contract.getCreationBlock()}`);
                    this.creationDate = response.data.results[0]?.timestamp;
                    if (this.contract.getName()) {
                        this.title = this.contract.getName();
                        if(this.contract.properties?.symbol){
                            this.title = this.title + ' (' + this.contract.properties.symbol + ')';
                        }
                    } else {
                        this.title = this.$t('pages.contract');
                    }
                }
            }

            this.balance = this.getBalanceDisplay(account.balance);
            this.telosAccount = account.account;
            this.accountLoading = false;
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
            return this.$t('pages.tlos_balance', { balance: strBalance });
        },
        getAddressNativeExplorerURL() {
            if (!this.telosAccount) {
                return '';
            }

            return this.$t('pages.account_url', { domain: process.env.NETWORK_EXPLORER, account: this.telosAccount });
        },
        disableConfirmation(){
            this.confirmationDialog = false;
        },
        getIcon,
    },
};
</script>

<template>
<div class="pageContainer q-pt-xl">
    <div>
        <div class="row tableWrapper justify-between q-mb-lg">
            <div class="homeInfo">
                <div class="flex">
                    <q-img
                        v-if="this.contract?.supportedInterfaces.includes('erc20')"
                        class="coin-icon"
                        :src="getIcon(this.contract.logoURI)"
                    />
                    <div class="text-primary text-h4 q-pr-xs">
                        {{ title }}
                    </div>
                    <q-icon
                        v-if="isContract"
                        class="cursor"
                        :name="this.contract?.isVerified() ? 'verified' : 'warning'"
                        :class="this.contract?.isVerified() ? 'text-positive' : 'text-negative'"
                        size="1.25rem"
                        @click="confirmationDialog = true"
                    />
                </div>
                <ConfirmationDialog
                    class="text-secondary"
                    :flag="confirmationDialog"
                    :address="address"
                    :status="this.contract?.isVerified()"
                    @dialog="disableConfirmation"
                />
                <CopyButton
                    class="text-secondary"
                    :text="address"
                    :accompanyingText="address"
                    description="address"
                />
                <template v-if="contract">
                    <div class="text-white">
                        {{ $t('pages.created_at_trx' )}} &nbsp;
                        <TransactionField :transaction-hash="contract.getCreationTrx()"/>
                    </div>
                    <div class="text-white">{{ $t('pages.by_address') }}
                        <AddressField :address="contract.getCreator()"/>
                    </div>
                    <div class="text-white">
                        <DateField :epoch="creationDate / 1000" :default-to-age="false" :force-show-age="false" />
                    </div>
                </template>
                <small v-else>
                    <div class="text-white">
                        {{ $t('pages.number_used_once') }}:&nbsp;
                        <span>{{ nonce }}</span>
                    </div>
                </small>
            </div>
            <div class="dataCardsContainer">
                <div v-if="!!telosAccount" class="dataCardItem">
                    <div class="dataCardTile">
                        {{ $t('pages.native_account') }}
                    </div>
                    <div class="dataCardData">
                        <a :href="getAddressNativeExplorerURL()" target="_blank">{{ telosAccount }}</a>
                    </div>
                </div>
                <div v-if="!!balance" class="dataCardItem balance ">
                    <div class="dataCardTile">
                        {{ $t('pages.balance') }}
                    </div>
                    <div class="dataCardData">
                        {{balance}}
                    </div>
                </div>
            </div>
        </div>
        <q-tabs
            v-model="tab"
            class="tabs-header tabsBar topRounded text-white tableWrapper"
            dense
            active-color="secondary"
            align="justify"
            narrow-indicator
            :class="{ 'q-dark': $q.dark.isActive}"
        >
            <q-route-tab
                name="transactions"
                :to="{ hash: '#transactions' }"
                exact
                replace
                :label="$t('pages.transactions')"
            />
            <q-route-tab
                name="int_transactions"
                :to="{ hash: '#int_transactions' }"
                exact
                replace
                :label="$t('pages.internal_txns')"
            />
            <q-route-tab
                name="erc20_transfers"
                :to="{ hash: '#erc20' }"
                exact
                replace
                :label="$t('pages.erc20_transfers')"
            />
            <q-route-tab
                name="erc721_transfers"
                :to="{ hash: '#erc721' }"
                exact
                replace
                :label="$t('pages.erc721_transfers')"
            />
            <q-route-tab
                name="erc1155_transfers"
                :to="{ hash: '#erc1155' }"
                exact
                replace
                :label="$t('pages.erc1155_transfers')"
            />
            <q-route-tab
                name="tokens"
                :to="{ hash: '#tokens' }"
                exact
                replace
                :label="$t('pages.tokens')"
            />
            <q-route-tab
                v-if="isContract"
                name="contract"
                :to="{ hash: '#contract' }"
                exact
                replace
                :label="$t('pages.contract')"
            />
        </q-tabs>
        <div class="q-mb-md tableWrapper">
            <q-tab-panels
                :key="address"
                v-model="tab"
                class="shadow-2"
                animated
                keep-alive="keep-alive"
            >
                <q-tab-panel name="transactions">
                    <TransactionTable :title="address" :filter="'/address/' + address"/>
                </q-tab-panel>
                <q-tab-panel name="int_transactions">
                    <InternalTransactionTable :title="address" :filter="{address}"/>
                </q-tab-panel>
                <q-tab-panel name="erc20_transfers">
                    <TransferTable
                        title="ERC-20 Transfers"
                        token-type="erc20"
                        :initialPageSize="10"
                        :address="address"
                    />
                </q-tab-panel>
                <q-tab-panel name="erc1155_transfers">
                    <TransferTable
                        title="ERC-1155 Transfers"
                        token-type="erc1155"
                        :initialPageSize="10"
                        :address="address"
                    />
                </q-tab-panel>
                <q-tab-panel name="erc721_transfers">
                    <TransferTable
                        title="ERC-721 Transfers"
                        token-type="erc721"
                        :initialPageSize="10"
                        :address="address"
                    />
                </q-tab-panel>
                <q-tab-panel name="tokens">
                    <TokenList :address="address"/>
                </q-tab-panel>
                <q-tab-panel v-if="isContract" name="contract">
                    <ContractTab v-if="contract?.isVerified()" :contract="contract"/>
                    <GenericContractInterface v-else  :contract="contract" />
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</div>
</template>

<style scoped lang="sass">
.shadow-2
    box-shadow: none !important

.dataCardsContainer .dataCardItem
  width: fit-content
  height: 5rem

.homeInfo .text-secondary .q-icon
  color: white !important

.q-tab-panel
  padding: 0

.q-icon
  padding-bottom: .75rem
  vertical-align: middle

.cursor
  cursor: pointer

.coin-icon
  border-radius: 100%
  width: 32px
  height: 32px
  vertical-align: middle
  margin-right: 7px
  margin-bottom: 5px

.tabs-header
  background: white
  color: black !important
  &.q-dark
    background: $dark
    color: white !important

.text-primary
  display: inline-block

@media only screen and (max-width: 1200px)
    .pageContainer
        div
            .tableWrapper
                &:first-child
                    padding: 20px
@media only screen and (max-width: 768px)
    .homeInfo > .flex
        align-items: center
        flex-wrap: inherit
    .coin-icon
        margin-bottom: 8px
        flex-shrink: 0
        width: 28px
        height: 28px
    .dataCardsContainer
        width: 100%
        justify-content: center
        .dataCardItem
            width: 100%
    .pageContainer
        padding-top: 30px
        background: linear-gradient(#252a5e 17.19%, #2d4684 45.83%, transparent 65.83%)
    .tableWrapper
        justify-content: center
    .homeInfo
        padding: 20px
        text-align: center
        margin-bottom: 30px
        .c-copy-button
            width: 100%
            word-break: break-word
        .text-h4
            margin-bottom: 10px
            word-break: break-word
            line-height: 1.3em
            font-size: 2.4em
</style>
