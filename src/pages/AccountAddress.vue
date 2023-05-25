<!-- eslint-disable vue/no-unused-components -->
<script>
import { toChecksumAddress, formatWei, WEI_PRECISION } from 'src/lib/utils';
import { getIcon } from 'src/lib/token-utils';
import { BigNumber } from 'ethers';
import TransactionTable from 'components/TransactionTable';
import InternalTransactionTable from 'components/InternalTransactionTable';
import TransferTable from 'components/TransferTable';
import TokenList from 'components/Token/TokenList';
import ApprovalList from 'components/Token/ApprovalList';
import HolderList from 'components/Token/HolderList';
import NFTList from 'components/NFT/NFTList';
import ConfirmationDialog from 'components/ConfirmationDialog';
import ContractTab from 'components/ContractTab/ContractTab';
import TransactionField from 'components/TransactionField';
import AddressField from 'components/AddressField';
import CopyButton from 'components/CopyButton';
import GenericContractInterface from 'components/ContractTab/GenericContractInterface.vue';
import DateField from 'components/DateField';
import { mapGetters } from 'vuex';

const tabs = {
    transactions: '#transactions',
    nfts: '#nfts',
    holders: '#holders',
    collection: '#collection',
    approvals: '#approvals',
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
        HolderList,
        AddressField,
        ApprovalList,
        ConfirmationDialog,
        ContractTab,
        CopyButton,
        NFTList,
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
            fullTitle: null,
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
        accountAddress() {
            return this.$route.params?.address ?? '';
        },
        ...mapGetters('login', ['address', 'isLoggedIn']),
    },
    watch: {
        address: {
            handler(newValue) {
                if (toChecksumAddress(newValue) === toChecksumAddress(this.accountAddress)) {
                    // Bring back approvals...
                }
            },
            immediate: true,
        },
        accountAddress: {
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
    async mounted() {
        await this.loadAccount();
    },
    methods: {
        async loadAccount() {
            if(!this.accountAddress){
                return;
            }
            this.accountLoading = true;
            this.isContract = false;
            const tokenList = await this.$contractManager.getTokenList();
            let account = {};
            try {
                const response = await this.$indexerApi.get(
                    `/account/${this.accountAddress}/balances?contract=___NATIVE_CURRENCY___`,
                );
                account.balance = (response.data?.results?.length > 0) ? response.data.results[0].balance : '0';
            } catch (e) {
                console.error('Could not get balance: ', e);
            }
            this.contract = null;
            this.fullTitle = null;
            this.nonce = 0;
            this.title = this.$t('pages.account');
            const contract = await this.$contractManager.getContract(this.accountAddress);
            if (contract?.creationInfo?.transaction){
                this.contract = contract;
                if(this.contract.supportedInterfaces?.includes('erc20')){
                    tokenList.tokens.forEach((token) => {
                        if(token.address.toLowerCase() ===  this.contract.address.toLowerCase()){
                            this.contract.logoURI = token.logoURI;
                            this.contract.setVerified(true);
                        }
                    });
                }
                this.title = this.$t('pages.contract');
                this.isContract = true;
                const response = await this.$indexerApi.get(`/block/${this.contract.getCreationBlock()}`);
                this.creationDate = response.data.results[0]?.timestamp;
                if (this.contract.getName()) {
                    this.fullTitle = this.contract.getName();
                    this.title = (this.fullTitle.length > 22)
                        ? this.fullTitle.slice(0, 22) + '..'
                        : this.fullTitle
                    ;
                    if(this.contract.properties?.symbol){
                        this.title = this.title + ' (' + this.contract.properties.symbol + ')';
                    }
                } else {
                    this.title = this.$t('pages.contract');
                }
            } else {
                this.$contractManager.addContractToCache(this.accountAddress, { address: this.accountAddress });
                if(this.$isAntelopeCapable){
                    try {
                        const account = await this.$evm.telos.getEthAccount(this.accountAddress);
                        this.telosAccount = account?.account;
                        this.nonce = account?.nonce;
                    } catch (e) {
                        console.info(e);
                    }
                } else {
                    const result = await this.$evmEndpoint.post('/evm', {
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'eth_getTransactionCount',
                        params: [this.accountAddress],
                    });
                    this.nonce = BigNumber.from(result.data?.result).toString();
                }
            }

            this.balance = this.getBalanceDisplay(account?.balance?.toString() || '0');
            this.accountLoading = false;
        },
        getBalanceDisplay(balance) {
            let strBalance = formatWei(balance, WEI_PRECISION, 4);
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
        formatWei,
        toChecksumAddress,
    },
};
</script>

<template>
<div :key="accountAddress" class="pageContainer q-pt-xl">
    <div>
        <div class="row tableWrapper justify-between q-mb-lg">
            <div class="homeInfo">
                <div class="flex">
                    <q-img
                        v-if="this.contract?.supportedInterfaces.includes('erc20')"
                        class="coin-icon"
                        :alt="this.contract.getName() + ' ERC20 token'"
                        :src="getIcon(this.contract.logoURI)"
                    />
                    <q-icon
                        v-else-if="!contract"
                        class="q-mr-xs"
                        name="account_circle"
                        size="md"
                    />
                    <q-icon
                        v-else
                        :name="(contract.supportedInterfaces.includes('erc721')) ? 'perm_media' : 'source'"
                        class="q-mr-sm"
                        size="md"
                    />
                    <div class="text-primary text-h4 q-pr-xs q-pb-md">
                        <span>{{ title }}</span>
                        <q-tooltip v-if="fullTitle">{{ fullTitle }} </q-tooltip>
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
                <div class="flex">
                    <div>
                        <ConfirmationDialog
                            class="text-secondary"
                            :flag="confirmationDialog"
                            :address="this.accountAddress"
                            :status="this.contract?.isVerified()"
                            @dialog="disableConfirmation"
                        />
                        <CopyButton
                            class="text-secondary"
                            :text="this.accountAddress"
                            :accompanyingText="this.accountAddress"
                            description="address"
                        />
                        <template v-if="this.contract">
                            <div v-if="contract.getCreationTrx()" class="text-white">
                                {{ $t('pages.created_at_trx' )}}
                                <TransactionField :transaction-hash="contract.getCreationTrx()"/>
                            </div>
                            <div v-if="contract.getCreator()" :key="contract.getCreator()" class="text-white">
                                {{ $t('pages.by_address') }}
                                <AddressField
                                    :address="contract.getCreator()"
                                    :truncate="22"
                                />
                            </div>
                            <div v-if="creationDate > 0" class="text-white">
                                <DateField
                                    :epoch="creationDate / 1000"
                                    :default-to-age="false"
                                    :force-show-age="false"
                                />
                            </div>
                            <div v-if="this.contract.supportedInterfaces.length > 0" class="q-pt-md">
                                <span>
                                    <span
                                        v-for="intf in contract.supportedInterfaces"
                                        v-bind:key="intf"
                                        class="supported-interface bg-primary q-pa-sm text-secondary"
                                    >
                                        {{ intf.replace('_', ' ') }}
                                    </span>
                                    <q-tooltip>{{ $t('pages.supported_interfaces')}}</q-tooltip>
                                </span>
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
                        <div
                            v-if="this.contract && this.contract.properties?.price
                                && parseFloat(this.contract.properties.price) > 0"
                            class="dataCardItem balance "
                        >
                            <div class="dataCardTile">
                                {{ $t('components.usd_price') }}
                            </div>
                            <div class="dataCardData">
                                <span v-if="this.contract.properties.price < 0.0001">{{ '< 0.0001 $' }}</span>
                                <span v-else>
                                    {{
                                        Number(parseFloat(contract.properties.price))
                                            .toLocaleString('en-US', { minimumFractionDigits: 4 })
                                    }} $
                                </span>
                            </div>
                            <q-tooltip> {{ $t('components.price_sources') }}</q-tooltip>
                        </div>
                        <div
                            v-if="
                                this.contract && this.contract.properties?.marketcap
                                    && parseFloat(this.contract.properties.marketcap) > 0
                            "
                            class="dataCardItem balance "
                        >
                            <div class="dataCardTile">
                                {{ $t('components.usd_marketcap') }}
                            </div>
                            <div class="dataCardData">
                                <span v-if="parseFloat(contract.properties.marketcap)< 0.0001">{{ '< 0.0001 $' }}</span>
                                <span v-else>
                                    {{ Number(parseFloat(contract.properties.marketcap))
                                        .toLocaleString('en-US', { minimumFractionDigits: 4 })
                                    }} $
                                </span>
                            </div>
                            <q-tooltip> {{ $t('components.marketcap_sources') }}</q-tooltip>
                        </div>
                        <div
                            v-if="
                                this.contract && this.contract.properties?.supply
                                    && (this.contract.supportedInterfaces.includes('erc721')
                                        || this.contract.supportedInterfaces.includes('erc20'))
                            "
                            class="dataCardItem"
                        >
                            <div
                                v-if="this.contract.supportedInterfaces.includes('erc721')"
                                :key="contract.properties.supply + contract.address"
                            >
                                <div class="dataCardTile text-center">
                                    {{ $t('pages.minted') }}
                                </div>
                                <div class="dataCardData text-center">
                                    <span>
                                        {{ contract.properties.supply }}
                                    </span>
                                    <q-tooltip>{{ $t('pages.total_nfts_minted') }}</q-tooltip>
                                </div>
                            </div>
                            <div v-else>
                                <div class="dataCardTile text-center">
                                    {{ $t('pages.telos_supply') }}
                                </div>
                                <div class="dataCardData text-center">
                                    <span>
                                        {{
                                            Number(parseFloat(formatWei(
                                                contract.properties.supply,
                                                contract.properties.decimals
                                            ))).toLocaleString('en-US', { minimumFractionDigits: 4 })
                                        }}
                                    </span>
                                </div>
                                <q-tooltip>
                                    {{ Number(formatWei(
                                        contract.properties.supply ,
                                        contract.properties.decimals
                                    )).toLocaleString('en-US', {
                                        minimumFractionDigits: 4,
                                        maximumFractionDigits: contract.properties?.decimals
                                    })}}
                                </q-tooltip>
                            </div>
                        </div>
                        <div
                            v-else-if="!this.contract && balance != null"
                            class="dataCardItem balance"
                        >
                            <div class="dataCardTile">
                                {{ $t('pages.balance') }}
                            </div>
                            <div class="dataCardData">
                                {{ balance }}
                            </div>
                        </div>
                        <div
                            v-if="this.contract && this.contract.properties?.holders &&
                                (this.contract.supportedInterfaces.includes('erc20')
                                    || this.contract.supportedInterfaces.includes('erc721'))"
                            class="dataCardItem"
                        >
                            <div class="dataCardTile">
                                {{ $t('pages.holders') }}
                            </div>
                            <div class="dataCardData">
                                {{ contract.properties?.holders }}
                            </div>
                            <q-tooltip>{{ $t('pages.evm_holders')  }}</q-tooltip>
                        </div>
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
                v-if="contract && contract.supportedInterfaces.includes('erc721')"
                name="collection"
                :to="{ hash: '#collection' }"
                exact
                replace
                :label="$t('components.nfts.collection')"
            />
            <q-route-tab
                v-if="contract && contract.isToken()"
                name="holders"
                :to="{ hash: '#holders' }"
                exact
                replace
                :label="$t('pages.holders')"
            />
            <q-route-tab
                v-else-if="!contract"
                name="nfts"
                :to="{ hash: '#nfts' }"
                exact
                replace
                :label="$t('components.nfts.nfts')"
            />
            <q-route-tab
                v-if="!contract && isLoggedIn && toChecksumAddress(this.accountAddress) === toChecksumAddress(address)"
                name="approvals"
                :to="{ hash: '#approvals' }"
                exact
                replace
                :label="$t('pages.approvals')"
            />
            <q-route-tab
                v-else-if="contract && !contract.isToken()"
                name="int_transactions"
                :to="{ hash: '#int_transactions' }"
                exact
                replace
                :label="$t('pages.internal_txns')"
            />
            <q-route-tab
                name="tokens"
                :to="{ hash: '#tokens' }"
                exact
                replace
                :label="$t('pages.tokens')"
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
                    <TransactionTable
                        :title="accountAddress"
                        :filter="'/address/' + accountAddress"
                        :address="accountAddress"
                    />
                </q-tab-panel>
                <q-tab-panel v-if="contract && contract.supportedInterfaces.includes('erc721')" name="collection">
                    <NFTList :address="contract.address" filter="contract" />
                </q-tab-panel>
                <q-tab-panel v-if="contract && contract.isToken()" name="holders">
                    <HolderList :contract="contract" />
                </q-tab-panel>
                <q-tab-panel v-else name="int_transactions">
                    <InternalTransactionTable :title="accountAddress" :filter="{accountAddress}"/>
                </q-tab-panel>
                <q-tab-panel
                    v-if="
                        !contract
                            && isLoggedIn
                            && toChecksumAddress(this.accountAddress) === toChecksumAddress(address)
                    "
                    name="approvals"
                >
                    <ApprovalList  :accountAddress="accountAddress" />
                </q-tab-panel>
                <q-tab-panel v-if="!contract" name="nfts">
                    <NFTList :address="accountAddress" filter="account" />
                </q-tab-panel>
                <q-tab-panel name="tokens">
                    <TokenList :address="accountAddress"/>
                </q-tab-panel>
                <q-tab-panel name="erc20_transfers">
                    <TransferTable
                        title="ERC-20 Transfers"
                        token-type="erc20"
                        :initialPageSize="10"
                        :address="accountAddress"
                    />
                </q-tab-panel>
                <q-tab-panel name="erc1155_transfers">
                    <TransferTable
                        title="ERC-1155 Transfers"
                        token-type="erc1155"
                        :initialPageSize="10"
                        :address="accountAddress"
                    />
                </q-tab-panel>
                <q-tab-panel name="erc721_transfers">
                    <TransferTable
                        title="ERC-721 Transfers"
                        token-type="erc721"
                        :initialPageSize="10"
                        :address="accountAddress"
                    />
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
  min-width: auto
  height: 5rem

.dataCardsContainer .dataCardData span
  font-size: 1.2rem

body.body--dark .supported-interface
  background: #282828 !important

.supported-interface
  height: auto
  user-select: none
  border-radius: 5px
  font-size: 0.8em
  margin-right: 3px
  line-height: initial

.homeInfo > .flex:nth-child(2)
  align-content: stretch
  justify-content: space-between

.homeInfo
  width: 100%

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
    .dataCardsContainer .dataCardData span
        font-size: 1rem
    .pageContainer
        div
            .tableWrapper
                &:first-child
                    padding: 20px
@media only screen and (max-width: 768px)
    .dataCardsContainer .dataCardData span
        font-size: 1.2rem
        margin-top: 10px
        display: block
        margin-bottom: 7px
    .homeInfo > .flex:nth-child(2)
        display: block
    .homeInfo > .flex
        align-items: center
        flex-wrap: inherit
        justify-content: center
    .coin-icon
        margin-bottom: 8px
        flex-shrink: 0
        width: 28px
        height: 28px
    .dataCardsContainer
        width: 100%
        margin-top: 30px
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
            margin-bottom: 0px
            margin-top: 3px
            word-break: break-word
            line-height: 1.3em
            font-size: 2.4em
@media only screen and (max-width: 380px)
    .homeInfo
        .q-icon.text-positive
            font-size: 0.9rem !important
            margin-top: -7px
        .q-icon
            font-size: 1.25rem !important
        .text-h4
            font-size: 2em
</style>
