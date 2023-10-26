<!-- eslint-disable vue/no-unused-components -->
<script>
import { toChecksumAddress } from 'src/lib/utils';
import { Web3 } from 'web3';
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
            isVerified: null,
            contract: null,
            verificationDate: '',
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
    mounted() {
        this.loadAccount();
    },
    methods: {
        async loadAccount() {
            if (!this.address) {
                return;
            }
            this.accountLoading = true;

            const account = await this.$evm.telos.getEthAccount(this.address);
            if (account.code.length > 0){
                this.isContract = true;
                this.contract = await this.$contractManager.getContract(this.address);
                this.isVerified = this.contract.verified;
            }

            this.balance = this.getBalanceDisplay(account.balance);
            this.telosAccount = account.account;
            this.isContract = account.code.length > 0;

            if (this.isContract === false){
                this.contract = null;
                this.nonce = account.nonce;
            }

            const isVerifiedContract = this.isContract && this.isVerified;
            const knownToken = this.$contractManager.tokenList.tokens
                .find(({ address }) => address.toLowerCase() === this.address.toLowerCase());

            if (knownToken?.name) {
                this.title = knownToken.name;
            } else if (isVerifiedContract) {
                this.title = this.contract.getName();
            } else if (this.isContract) {
                this.title = this.$t('pages.contract');
            } else {
                this.title = this.$t('pages.account');
            }

            this.accountLoading = false;
        },
        getBalanceDisplay(balance) {
            let strBalance = web3.utils.fromWei(balance, 'ether');
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
    },
};
</script>

<template>
<div class="pageContainer q-pt-xl">
    <div>
        <div class="row tableWrapper justify-between q-mb-lg">
            <div class="homeInfo">
                <div class="text-primary text-h4 q-pr-xs">
                    {{ title }}
                </div>
                <q-icon
                    v-if="isContract && isVerified !== null"
                    class="cursor"
                    :name="isVerified ? 'verified' : 'warning'"
                    :class="isVerified ? 'text-positive' : 'text-negative'"
                    size="1.25rem"
                    @click="confirmationDialog = true"
                />
                <ConfirmationDialog
                    class="text-secondary"
                    :flag="confirmationDialog"
                    :address="address"
                    :status="isVerified"
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
                        &nbsp;
                        <AddressField :address="contract.getCreator()"/>
                    </div>
                </template>
                <small v-else>
                    <div class="text-white">
                        {{ $t('pages.number_used_once') }}: &nbsp;
                        <span class="q-pl-xs">{{ nonce }}</span>
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
                    <TransactionTable :title="address" :filter="{address}"/>
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
                    <ContractTab v-if="isVerified" :contract="contract"/>
                    <GenericContractInterface v-else/>
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

.cursor
  cursor: pointer

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
        .text-h4
            margin-bottom: 10px
            word-break: break-word
            line-height: 1.3em
            font-size: 2.4em
</style>
