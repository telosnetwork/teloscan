<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { contractManager } from 'src/boot/telosApi';
import { indexerApi } from 'src/boot/telosApi';
import { evm } from 'src/boot/evm';
import { toChecksumAddress, formatWei } from 'src/lib/utils';
import { getIcon } from 'src/lib/token-utils';

import TransactionTable from 'components/TransactionTable.vue';
import InternalTransactionTable from 'components/InternalTransactionTable.vue';
import TransferTable from 'components/TransferTable.vue';
import TokenList from 'components/Token/TokenList.vue';
import ApprovalList from 'components/Token/ApprovalList.vue';
import HolderList from 'components/Token/HolderList.vue';
import NFTList from 'components/Token/NFTList.vue';
import ConfirmationDialog from 'components/ConfirmationDialog.vue';
import ContractTab from 'components/ContractTab/ContractTab.vue';
import TransactionField from 'components/TransactionField.vue';
import AddressField from 'components/AddressField.vue';
import CopyButton from 'components/CopyButton.vue';
import GenericContractInterface from 'components/ContractTab/GenericContractInterface.vue';
import DateField from 'components/DateField.vue';
import AddressQR from 'src/components/AddressQR.vue';
import AddressOverview from 'src/components/AddressOverview.vue';
import AddressMoreInfo from 'src/components/AddressMoreInfo.vue';

const tabs = {
    transactions: '#transactions',
    holders: '#holders',
    collection: '#collection',
    int_transactions: '#int_transactions',
    tokens: '#tokens',
    contract: '#contract',
    transfers: '#transfers',
    approvals: '#approvals',
    nfts: '#nfts',
};

const subtabs = {
    erc1155_nfts: '#erc1155_nfts',
    erc721_nfts: '#erc721_nfts',
    erc20_approvals: '#erc20_approvals',
    erc721_approvals: '#erc721_approvals',
    erc1155_approvals: '#erc1155_approvals',
    erc20_transfers: '#erc20_transfers',
    erc721_transfers: '#erc721_transfers',
    erc1155_transfers: '#erc1155_transfers',
};

const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useStore();

const accountLoading = ref(false);
const title = ref('');
const fullTitle = ref('');
const telosAccount = ref('');
const balance = ref('0');
const nonce = ref<number | null>(null);
const isContract = ref(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contract = ref<any | null>(null);
const hash = ref('');
interface Map {
  [key: string]: boolean
}
const indicators = ref<Map>({
    'approvals': false,
    'nfts': false,
    'transfers': false,
});
const menus = ref<Map>({
    'approvals': false,
    'nfts': false,
    'transfers': false,
});
const creationDate = ref(0);
const tab = ref('#transactions');
const subtab = ref('#transactions');
const confirmationDialog = ref(false);

const accountAddress = computed(() => route.params.address as string ?? '');
const isLoggedIn = computed(() => store.getters['login/isLoggedIn']);
const address = computed(() => store.getters['login/address']);

watch(route, async (newRoute, oldRoute) => {
    if (newRoute !== oldRoute) {
        const { hash: newHash } = newRoute;
        hash.value = newHash;
        if (newRoute.name !== 'address' || !newHash) {
            return;
        }

        if (accountLoading.value && newHash === tabs.contract) {
            // wait for account to load; this.isContract will not be set immediately on first load
            await new Promise(resolve => setTimeout(resolve, 750));
        }

        const tabHashes = Object.values(tabs);
        const subtabHashes = Object.values(subtabs);

        if(subtabHashes.includes(newHash)){
            subtab.value = hash.value;
            tab.value = hash.value.split('_')[1];
            toggleMenus(tab.value);
        } else if (['#transfers', '#nfts', '#approvals'].includes(hash.value)) {
            if(hash.value === '#transfers' || hash.value === '#approvals'){
                subtab.value = 'erc20_' + hash.value;
            } else if (hash.value === '#nfts'){
                subtab.value = 'erc721_nfts';
            }
            tab.value = hash.value;
            toggleMenus(tab.value);
        }
        const newHashIsInvalid =
            !tabHashes.includes(newHash) && !subtabHashes.includes(newHash) ||
            (newHash === tabs.contract && !isContract.value);

        if (newHashIsInvalid) {
            router.replace({ hash: tabs.transactions });
        }
    }

}, { deep: true, immediate: true });

watch(accountAddress, async (newVal, oldVal) => {
    if (newVal !== oldVal) {
        const newAsChecksum = toChecksumAddress(newVal);
        if (newAsChecksum !== newVal) {
            router.replace({ params: { address: newAsChecksum } });
        }
        await loadAccount();
    }
}, { deep: true, immediate: true });

async function loadAccount() {
    if(!accountAddress.value || accountLoading.value){
        return;
    }
    accountLoading.value = true;
    isContract.value = false;
    const tokenList = await contractManager.getTokenList();
    try {
        const response = await indexerApi.get(
            `/account/${accountAddress.value}/balances?includeAbi=true`,
            // `/account/${accountAddress.value}/balances?contract=___NATIVE_CURRENCY___&includeAbi=true`,
        );
        //TODO restore original api query when contract param query is fixed
        const systemTokenResult = response.data.results.find((r:any) => r.contract === '___NATIVE_CURRENCY___');

        // balance.value = (response.data?.results?.length > 0) ? response.data.results[0].balance : '0';
        balance.value = systemTokenResult.balance;
    } catch (e) {
        console.error('Could not get balance: ', e);
    }
    contract.value = null;
    fullTitle.value = '';
    nonce.value = 0;
    title.value = $t('pages.account');
    const cachedContract = await contractManager.getContract(accountAddress.value);
    if (cachedContract?.creationInfo?.transaction || cachedContract?.supportedInterfaces?.length > 0){
        contract.value = cachedContract;
        if(contract.value.supportedInterfaces?.includes('erc20')){
            tokenList.tokens.forEach((token: { address: string; issuer: any; issuer_link: any; logoURI: any; }) => {
                if(token.address.toLowerCase() ===  contract.value.address.toLowerCase()){
                    contract.value.issuer = token.issuer;
                    contract.value.issuer_link = token.issuer_link;
                    contract.value.logoURI = token.logoURI;
                    contract.value.setVerified(true);
                }
            });
        }
        title.value = $t('pages.contract');
        isContract.value = true;
        if(contract.value.getCreationBlock()){
            const response = await indexerApi.get(`/block/${contract.value.getCreationBlock()}`);
            creationDate.value = response.data.results[0]?.timestamp;
        }
        if (contract.value.getName()) {
            fullTitle.value = contract.value.getName();
            title.value = (fullTitle.value.length > 22)
                ? fullTitle.value.slice(0, 22) + '..'
                : fullTitle.value
            ;
            if(contract.value.properties?.symbol){
                title.value = title.value + ' (' + contract.value.properties.symbol + ')';
            }
        } else {
            title.value = $t('pages.contract');
        }
    } else {
        contractManager.addContractToCache(accountAddress.value, { address: accountAddress.value });
        try {
            const account = await evm.telos.getEthAccount(accountAddress.value);
            telosAccount.value = account?.account;
            nonce.value = account?.nonce;
        } catch (e) {
            console.info(e);
        }
    }

    accountLoading.value = false;
}



function getAddressNativeExplorerURL() {
    if (!telosAccount.value) {
        return '';
    }

    return $t('pages.account_url', { domain: process.env.NETWORK_EXPLORER, account: telosAccount.value });
}

function tabClass(active: any){
    if(active){
        return 'q-tab active relative-position self-stretch flex flex-center text-center';
    }
    return 'q-tab relative-position self-stretch flex flex-center text-center';
}

function cancelHide(evt: { preventDefault: () => void; stopPropagation: () => void; }){
    if(!evt) {
        return;
    }
    tab.value = subtab.value.split('_')[1];
    evt.preventDefault();
    evt.stopPropagation();
    // this.$refs.panels.goTo(this.subtab);
}

function toggleMenus(menu: string){
    for(let i in menus.value){
        menus.value[i] = false;
        indicators.value[i] = false;
    }
    if(menu){
        if(!subtab.value || !subtab.value.includes(menu)){
            subtab.value = (menu === 'nfts') ? 'erc721_nfts' : 'erc20_' + menu;
        }
        hash.value = subtab.value;
        menus.value[menu] = true;
        indicators.value[menu] = true;
        // $refs.panels.goTo(this.subtab);
    }
}

function disableConfirmation(){
    confirmationDialog.value = false;
}

</script>

<template>
<div v-if="accountAddress && !accountLoading" :key="accountAddress" class="pageContainer q-pt-xl">
    <div>
        <div class="row tableWrapper justify-between q-mb-lg">
            <div class="homeInfo">
                <div class="flex">
                    <q-img
                        v-if="contract?.supportedInterfaces?.includes('erc20')"
                        class="coin-icon"
                        :alt="contract.getName() + ' ERC20 token'"
                        :src="getIcon(contract.logoURI)"
                    />
                    <q-icon
                        v-else-if="!contract"
                        class="q-mr-xs"
                        name="account_circle"
                        size="sm"
                    />
                    <q-icon
                        v-else
                        :name="(contract.supportedInterfaces?.includes('erc721')) ? 'perm_media' : 'source'"
                        class="q-mr-sm"
                        size="sm"
                    />
                    <div class=" text-h6 q-pr-xs q-pb-md">
                        <span>{{ title }}</span>
                        <CopyButton
                            :text="accountAddress"
                            :accompanyingText="accountAddress"
                            description="address"
                            class="address-copy"
                        />
                        <AddressQR
                            v-if="accountAddress"
                            :address="accountAddress"
                            class="qr-code"
                        />
                        <q-tooltip v-if="fullTitle">{{ fullTitle }} </q-tooltip>
                    </div>
                    <div v-if="isContract">
                        <q-icon
                            v-if="contract.isVerified()"
                            name="verified"
                            class="text-positive"
                            size="1.25rem"
                        />
                        <q-icon
                            v-else
                            class="cursor text-negative"
                            name="warning"
                            size="1.25rem"
                            @click="confirmationDialog = true"
                        />
                        <q-tooltip v-if="contract.isVerified()">
                            {{ $t('components.contract_tab.verified_contract') }}
                        </q-tooltip>
                        <q-tooltip v-else>{{ $t('components.contract_tab.unverified_contract') }} </q-tooltip>
                    </div>
                </div>
                <div class="flex">
                    <div class="flex account-card">
                        <AddressOverview :balance="balance" class="account-card__item"/>
                    </div>
                    <div class="flex account-card">
                        <AddressMoreInfo class="account-card__item"/>
                    </div>
                </div>
                <div class="flex">
                    <div>
                        <ConfirmationDialog
                            :flag="confirmationDialog"
                            :address="accountAddress"
                            :status="contract?.isVerified()"
                            @dialog="disableConfirmation"
                        />
                        <template v-if="contract">
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
                            <div v-if="contract.issuer" class="text-white">
                                {{ $t('pages.issuer') }}
                                <a :href="contract.issuer_link" target="_blank">
                                    {{ contract.issuer }}
                                </a>
                            </div>
                            <div v-if="creationDate > 0" class="text-white">
                                <DateField
                                    :epoch="creationDate / 1000"
                                    :default-to-age="false"
                                    :force-show-age="false"
                                />
                            </div>
                            <div v-if="contract.supportedInterfaces?.length > 0" class="q-pt-md">
                                <span>
                                    <span
                                        v-for="intf in contract.supportedInterfaces"
                                        v-bind:key="intf"
                                        class="supported-interface bg-primary q-pa-sm"
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
                    <div class="metrics">
                        <div class="dataCardsContainer balance">
                            <div v-if="!!telosAccount" class="dataCardItem">
                                <div class="dataCardTile">
                                    {{ $t('pages.native_account') }}
                                </div>
                                <div class="dataCardData">
                                    <a :href="getAddressNativeExplorerURL()" target="_blank">{{ telosAccount }}</a>
                                </div>
                            </div>
                            <div
                                v-if="contract && contract.properties?.price
                                    && parseFloat(contract.properties.price) > 0"
                                class="dataCardItem"
                            >
                                <div class="dataCardTile">
                                    {{ $t('components.usd_price') }}
                                </div>
                                <div class="dataCardData">
                                    <span v-if="contract.properties.price < 0.0001">{{ '< 0.0001 $' }}</span>
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
                                    contract && contract.properties?.marketcap
                                        && parseFloat(contract.properties.marketcap) > 0
                                "
                                class="dataCardItem"
                            >
                                <div class="dataCardTile">
                                    {{ $t('components.usd_marketcap') }}
                                </div>
                                <div class="dataCardData">
                                    <span v-if="parseFloat(contract.properties.marketcap)< 0.0001">
                                        {{ '< 0.0001 $' }}
                                    </span>
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
                                    contract && contract.properties?.supply
                                        && (contract.supportedInterfaces?.includes('erc721')
                                            || contract.supportedInterfaces?.includes('erc20'))
                                "
                                class="dataCardItem"
                            >
                                <div
                                    v-if="contract.supportedInterfaces?.includes('erc721')"
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
                                v-if="contract && contract.properties?.holders &&
                                    (contract.supportedInterfaces?.includes('erc20')
                                        || contract.supportedInterfaces?.includes('erc721'))"
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
                :label="$t('pages.transactions.transactions')"
                @click.stop="toggleMenus('')"
            />
            <q-route-tab
                v-if="contract && contract.supportedInterfaces.includes('erc721')"
                name="collection"
                :to="{ hash: '#collection' }"
                exact
                replace
                :label="$t('components.nfts.collection')"
                @click.stop="toggleMenus('')"
            />
            <q-route-tab
                v-if="contract && contract.isToken()"
                name="holders"
                :to="{ hash: '#holders' }"
                exact
                replace
                :label="$t('pages.holders')"
                @click.stop="toggleMenus('')"
            />
            <q-route-tab
                v-if="contract && !contract.isToken()"
                name="int_transactions"
                :to="{ hash: '#int_transactions' }"
                exact
                replace
                :label="$t('pages.internal_txns')"
                @click.stop="toggleMenus('')"
            />
            <q-route-tab
                name="tokens"
                :to="{ hash: '#tokens' }"
                exact
                replace
                :label="$t('pages.tokens')"
                @click.stop="toggleMenus('')"
            />
            <q-tab
                v-if="!contract"
                name="nfts"
                :class="tabClass(indicators.nfts)"
                @click="toggleMenus('nfts')"
            >
                <q-btn-dropdown
                    v-model="menus.nfts"
                    label="NFTs"
                    class="q-tab"
                    :autoclose="true"
                    @hide="cancelHide"
                >
                    <q-list>
                        <q-route-tab
                            clickable
                            name="erc721_nfts"
                            :to="{ hash: '#erc721_nfts' }"
                            exact
                            replace
                            label="erc721"
                        />
                        <q-route-tab
                            clickable
                            name="erc1155_nfts"
                            :to="{ hash: '#erc1155_nfts' }"
                            exact
                            replace
                            label="erc1155"
                        />
                    </q-list>
                </q-btn-dropdown>
                <div class="q-tab__indicator absolute-bottom"></div>
            </q-tab>
            <q-tab
                v-if="
                    !contract
                        && isLoggedIn
                        && toChecksumAddress(accountAddress) === toChecksumAddress(address)
                "
                v-model="tab"
                name="approvals"
                :class="tabClass(indicators.approvals)"
                @click="toggleMenus('approvals')"
            >
                <q-btn-dropdown
                    v-model="menus.approvals"
                    :label="$t('pages.approvals')"
                    :autoclose="true"
                    class="q-tab"
                    @hide="cancelHide"
                >
                    <q-list>
                        <q-route-tab
                            clickable
                            name="erc20_approvals"
                            :to="{ hash: '#erc20_approvals' }"
                            exact
                            replace
                            label="erc20"
                        />
                        <q-route-tab
                            clickable
                            name="erc721_approvals"
                            :to="{ hash: '#erc721_approvals' }"
                            exact
                            replace
                            label="erc721"
                        />
                        <q-route-tab
                            clickable
                            name="erc1155_approvals"
                            :to="{ hash: '#erc1155_approvals' }"
                            exact
                            replace
                            label="erc1155"
                        />
                    </q-list>
                </q-btn-dropdown>
                <div class="q-tab__indicator absolute-bottom"></div>
            </q-tab>
            <q-tab
                :class="tabClass(indicators.transfers)"
                name="transfers"
                @click="toggleMenus('transfers')"
            >
                <q-btn-dropdown
                    v-model="menus.transfers"
                    label="Transfers"
                    class="q-tab"
                    :autoclose="true"
                    @hide="cancelHide"
                >
                    <q-list>
                        <q-route-tab
                            clickable
                            name="erc20_transfers"
                            :to="{ hash: '#erc20_transfers' }"
                            exact
                            replace
                            label="erc20"
                        />
                        <q-route-tab
                            clickable
                            name="erc721_transfers"
                            :to="{ hash: '#erc721_transfers' }"
                            exact
                            replace
                            label="erc721"
                        />
                        <q-route-tab
                            clickable
                            name="erc1155_transfers"
                            :to="{ hash: '#erc1155_transfers' }"
                            exact
                            replace
                            label="erc1155"
                        />
                    </q-list>
                </q-btn-dropdown>
                <div class="q-tab__indicator absolute-bottom"></div>
            </q-tab>
            <q-route-tab
                v-if="contract"
                name="contract"
                :to="{ hash: '#contract' }"
                exact
                replace
                :label="$t('pages.contract')"
            />
        </q-tabs>
        <div class="q-mb-md tableWrapper">
            <q-tab-panels
                ref="panels"
                :key="address"
                v-model="tab"
                animated
                keep-alive
            >
                <q-tab-panel name="transactions">
                    <TransactionTable
                        v-if="accountAddress"
                        :title="accountAddress"
                        :account-address="accountAddress"
                    />
                </q-tab-panel>
                <q-tab-panel
                    v-if="contract && contract.supportedInterfaces?.includes('erc721')"
                    name="collection"
                >
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
                            && toChecksumAddress(accountAddress) === toChecksumAddress(address)
                    "
                    v-model="subtab"
                    name="erc20_approvals"
                >
                    <ApprovalList type="erc20" :accountAddress="accountAddress" />
                </q-tab-panel>
                <q-tab-panel
                    v-if="
                        !contract
                            && isLoggedIn
                            && toChecksumAddress(accountAddress) === toChecksumAddress(address)
                    "
                    v-model="subtab"
                    name="erc721_approvals"
                >
                    <ApprovalList type="erc721" :accountAddress="accountAddress" />
                </q-tab-panel>
                <q-tab-panel
                    v-if="
                        !contract
                            && isLoggedIn
                            && toChecksumAddress(accountAddress) === toChecksumAddress(address)
                    "
                    v-model="subtab"
                    name="erc1155_approvals"
                >
                    <ApprovalList type="erc1155" :accountAddress="accountAddress" />
                </q-tab-panel>
                <q-tab-panel v-model="subtab" name="erc721_nfts">
                    <NFTList type="erc721" :address="accountAddress" filter="account" />
                </q-tab-panel>
                <q-tab-panel v-model="subtab" name="erc1155_nfts">
                    <NFTList type="erc1155" :address="accountAddress" filter="account" />
                </q-tab-panel>
                <q-tab-panel name="tokens">
                    <TokenList :address="accountAddress"/>
                </q-tab-panel>
                <q-tab-panel v-model="subtab" name="erc20_transfers">
                    <TransferTable
                        title="ERC-20 Transfers"
                        token-type="erc20"
                        :initialPageSize="10"
                        :address="accountAddress"
                        @before-hide="cancelHide"
                    />
                </q-tab-panel>
                <q-tab-panel :v-model="subtab" name="erc1155_transfers">
                    <TransferTable
                        title="ERC-1155 Transfers"
                        token-type="erc1155"
                        :initialPageSize="10"
                        :address="accountAddress"
                        @before-hide="cancelHide"
                    />
                </q-tab-panel>
                <q-tab-panel :v-model="subtab" name="erc721_transfers">
                    <TransferTable
                        title="ERC-721 Transfers"
                        token-type="erc721"
                        :initialPageSize="10"
                        :address="accountAddress"
                        @before-hide="cancelHide"
                    />
                </q-tab-panel>
                <q-tab-panel v-if="isContract" name="contract">
                    <ContractTab v-if="contract?.abi?.length > 0" :contract="contract"/>
                    <GenericContractInterface v-else  :contract="contract" />
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.address-copy{
    display: inline;
    font-size: 16px;
}

.account-card{
    width: 50%;
    &__item{
        width:100%;
        margin:.5rem;
    }
}





.tabeWrapper {
  max-width: 100vw;
}
.dataCardsContainer .dataCardItem {
  width: fit-content;
  min-width: auto;
  height: 3.5rem;
}

.dataCardsContainer .dataCardData {
  font-size: 1rem;
}
.dataCardsContainer .dataCardData span {
  font-size: 1rem;
}

body.body--dark .supported-interface {
  background: #282828 !important;
}

.dataCardsContainer {
  gap: 3px;
  justify-content: right;
}
.supported-interface {
  height: auto;
  user-select: none;
  border-radius: 5px;
  font-size: 0.8em;
  margin-right: 3px;
  line-height: initial;
}

body.desktop .q-focusable:focus .q-focus-helper {
  background: inherit;
  opacity: 0 !important;
}
body.ios .q-hoverable:active .q-focus-helper {
  background: inherit;
  opacity: 0;
}
.q-focus-helper {
  opacity: 0;
  transition: unset;
}

.homeInfo > .flex:nth-child(2) {
  align-content: stretch;
  justify-content: space-between;
}

.homeInfo {
  width: 100%;
  .metrics {
    margin-top: auto;
    flex: 1 1 0;
  }
}
.homeInfo .text-secondary .q-icon {
  color: white !important;
}

.q-tab-panel {
  padding: 0;
}

.q-icon {
    padding-top: 0.45rem;
    vertical-align: middle;
}

.cursor {
  cursor: pointer;
}

.coin-icon {
  border-radius: 100%;
  width: 32px;
  height: 32px;
  vertical-align: middle;
  margin-right: 7px;
  margin-bottom: 5px;
}

.q-tab:hover {
  color: $secondary;
}
.q-tab.active .q-tab__indicator {
  opacity: 1;
  color: $secondary;
}
.tabs-header .q-btn {
  display: block;
  height: 100%;
  padding: 16px 0px;
}
.tabs-header .q-btn.active {
    //
    background: transparent !important;
}

.tabs-header .q-btn {
  background: transparent !important;
}
.tabs-header .q-btn:hover {
  color: $secondary;
  background: transparent !important;
}
.tabs-header .q-btn:before, .tabs-header .q-btn:focus {
  box-shadow: none;
  background: transparent !important;
}
.tabs-header {
  background: white;
  color: black !important;
  &.q-dark {
    background: $dark;
    color: white !important;
  }
}

.text-primary {
  display: inline-block;
}

@media only screen and (max-width: 1200px) {
  .dataCardsContainer .dataCardData span {
    font-size: 1rem;
  }
//   .pageContainer div .tableWrapper &:first-child {
//     padding: 20px;
//   }
}
@media only screen and (max-width: 768px) {
  .dataCardsContainer .dataCardData span {
    font-size: 1.2rem;
    margin-top: 10px;
    display: block;
    margin-bottom: 7px;
  }
  .homeInfo > .flex:nth-child(2) {
    display: block;
  }
  .homeInfo > .flex {
    align-items: center;
    flex-wrap: inherit;
    justify-content: center;
  }
  .coin-icon {
    margin-bottom: 8px;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
  }
  .dataCardsContainer {
    width: 100%;
    margin-top: 30px;
    justify-content: center;
    .dataCardItem {
      width: 100%;
    }
  }
  .pageContainer {
    padding-top: 30px;
    background: linear-gradient(#252a5e 17.19%, #2d4684 45.83%, transparent 65.83%);
  }
  .tableWrapper {
    justify-content: center;
  }
  .homeInfo {
    padding: 20px;
    text-align: center;
    margin-bottom: 30px;
    .c-copy-button--block {
      width: 100%;
      word-break: break-word;
    }
    .text-h4 {
      margin-bottom: 0px;
      margin-top: 3px;
      word-break: break-word;
      line-height: 1.3em;
      font-size: 2.4em;
    }
  }
}
@media only screen and (max-width: 380px) {
  .homeInfo .q-icon.text-positive {
    font-size: 0.9rem !important;
    margin-top: -7px;
  }
  .q-icon {
    font-size: 1.25rem !important;
  }
  .text-h4 {
    font-size: 2em;
  }
}
</style>
