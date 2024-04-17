<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { contractManager } from 'src/boot/telosApi';
import { indexerApi } from 'src/boot/telosApi';
import { evm } from 'src/boot/evm';
import { toChecksumAddress } from 'src/lib/utils';
import { getIcon } from 'src/lib/token-utils';
import Contract from 'src/lib/contract/Contract';
import { BalanceQueryResponse, BalanceResult } from 'src/types/BalanceResult';
import { Token } from 'src/types/Token';

import TransactionTable from 'components/TransactionTable.vue';
import InternalTransactionTable from 'components/InternalTransactionTable.vue';
import NftTransfersTable from 'components/NftTransfersTable.vue';
import TokenList from 'components/Token/TokenList.vue';
import ApprovalList from 'components/Token/ApprovalList.vue';
import HolderList from 'components/Token/HolderList.vue';
import NFTList from 'components/Token/NFTList.vue';
import ContractTab from 'components/ContractTab/ContractTab.vue';
import CopyButton from 'components/CopyButton.vue';
import GenericContractInterface from 'components/ContractTab/GenericContractInterface.vue';
import AddressQR from 'src/components/AddressQR.vue';
import AddressOverview from 'src/components/AddressOverview.vue';
import AddressMoreInfo from 'src/components/AddressMoreInfo.vue';
import ContractMoreInfo from 'src/components/ContractMoreInfo.vue';
import ExportLink from 'pages/export/ExportLink.vue';

import { EXPORT_DOWNLOAD_TYPES } from 'src/lib/constants';

const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useStore();

const tabs = ['transactions', 'collection', 'holders', 'internaltx', 'tokens', 'nfts', 'approvals', 'tokentxns', 'erc721txns', 'erc1155txns', 'contract'];

const accountLoading = ref(false);
const title = ref('');
const fullTitle = ref('');
const telosAccount = ref('');
const balance = ref('0');
const nonce = ref<number | null>(null);
const contract = ref<Contract | null>(null);
const tab = ref(tabs[0]);
const initialLoadComplete = ref(false);

const accountAddress = computed(() => route.params.address as string ?? '');
const isLoggedIn = computed(() => store.getters['login/isLoggedIn']);
const address = computed(() => store.getters['login/address']);


watch(accountAddress, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        const newAsChecksum = toChecksumAddress(newVal);
        if (newAsChecksum !== newVal) {
            router.replace({ params: { address: newAsChecksum } });
        }
        loadAccount().then(() => {
            initialLoadComplete.value = true;
        });
    }
}, { deep: true, immediate: true });

watch(() => route.query.tab, (newTab) => {
    const str = newTab as string;
    tab.value = tabs.includes(str) ? str : tabs[0];
});

watch(tab, (newTab) => {
    router.push({ query: { tab: newTab } });
});

watch(isLoggedIn, (value) => {
    // if user logs out while on approvals tab return to transactions
    if (!value && tab.value === 'approvals'){
        router.push({ query: { tab: 'transactions' } });
    }
});

onMounted(() => {
    const tabQueryParam = route.query.tab as string;
    tab.value = tabs.includes(tabQueryParam) ? tabQueryParam : tabs[0];
});

async function loadAccount() {
    if(!accountAddress.value || accountLoading.value){
        return;
    }
    accountLoading.value = true;
    const tokenList = await contractManager.getTokenList();
    try {
        const response: BalanceQueryResponse = await indexerApi.get(
            `/account/${accountAddress.value}/balances?includeAbi=true`,
            // `/account/${accountAddress.value}/balances?contract=___NATIVE_CURRENCY___&includeAbi=true`,
        );
        //TODO restore original api query when contract param query is fixed
        const systemTokenResult = response.data.results.find((r : BalanceResult) => r.contract === '___NATIVE_CURRENCY___') as BalanceResult;

        // balance.value = (response.data?.results?.length > 0) ? response.data.results[0].balance : '0';
        balance.value = systemTokenResult ? systemTokenResult.balance : '0';
    } catch (e) {
        console.error('Could not get balance: ', e);
    }
    contract.value = null;
    fullTitle.value = '';
    nonce.value = 0;
    title.value = $t('pages.account');
    const force = true;
    const cachedContract = await contractManager.getContract(accountAddress.value, force);
    if (cachedContract?.creationInfo?.transaction || cachedContract?.supportedInterfaces?.length > 0){
        contract.value = cachedContract;
        if(contract.value && contract.value.supportedInterfaces?.includes('erc20')){
            tokenList.tokens.forEach((token: Token) => {
                if(token.address.toLowerCase() ===  contract.value?.address.toLowerCase()){
                    contract.value.issuer = token.issuer;
                    contract.value.issuer_link = token.issuer_link;
                    contract.value.logoURI = token.logoURI;
                    contract.value.setVerified(true);
                }
            });
        }
        title.value = $t('pages.contract');
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
    fullTitle.value = contract.value?.getName() ?? '';
}

</script>

<template>
<div v-if="accountAddress && !accountLoading" :key="accountAddress" class="c-address q-pt-xl">
    <div class="row justify-between q-mb-lg">
        <div class="col-12">
            <div class="c-address__header">
                <div class="c-address__header-text-container">
                    <q-img
                        v-if="contract && contract.supportedInterfaces?.includes('erc20')"
                        class="c-address__coin-icon"
                        :alt="contract.getName() + ' ERC20 token'"
                        :src="getIcon(contract.logoURI)"
                    />
                    <q-icon
                        v-else-if="!contract"
                        name="account_circle"
                        size="sm"
                    />
                    <q-icon
                        v-else
                        :name="(contract.supportedInterfaces?.includes('erc721')) ? 'perm_media' : 'source'"
                        size="sm"
                    />
                    <span class="c-address__title">{{ title }}</span>
                    <span class="c-address__hex">{{ accountAddress }}</span>
                    <q-tooltip v-if="fullTitle" anchor="top middle" self="bottom middle">{{ fullTitle }} </q-tooltip>
                </div>
                <div class="flex align-center">
                    <CopyButton
                        :text="accountAddress"
                        accompanyingText=""
                        description="address"
                        class="q-mr-sm"
                    />
                    <AddressQR
                        v-if="accountAddress"
                        :address="accountAddress"
                    />
                </div>
            </div>
        </div>

    </div>
    <div class="c-address__info-container row q-mb-lg q-col-gutter-md">
        <div class="col-12 col-md-6">
            <AddressOverview
                :balance="balance"
                :loadingComplete="initialLoadComplete"
            />
        </div>
        <div class="col-12 col-md-6">
            <ContractMoreInfo
                v-if="contract"
                :address="contract?.getCreator() ?? ''"
                :transaction="contract?.getCreationTrx() ?? ''"
                :loadingComplete="initialLoadComplete"
            />
            <AddressMoreInfo
                v-else
                :address="accountAddress"
                :loadingComplete="initialLoadComplete"
            />
        </div>
    </div>
    <q-tabs
        v-model="tab"
        dense
        class="c-address__tabs"
        active-class="c-address__tabs-tab--active"
        content-class="c-address__tabs-content"
        indicator-color="transparent"
    >
        <q-tab
            name="transactions"
            class="c-address__tabs-tab"
            :label="$t('pages.transactions.transactions')"
        />
        <q-tab
            v-if="contract && contract.supportedInterfaces.includes('erc721')"
            name="collection"
            class="c-address__tabs-tab"
            :label="$t('components.nfts.collection')"
        />
        <q-tab
            v-if="contract && contract.isToken()"
            name="holders"
            class="c-address__tabs-tab"
            :to="{ query: {tab: 'holders' }}"
            :label="$t('pages.holders')"
        />
        <q-tab
            v-else
            name="internaltx"
            class="c-address__tabs-tab"
            :label="$t('pages.internal_txns')"
        />
        <q-tab
            name="tokens"
            class="c-address__tabs-tab"
            :label="$t('pages.tokens')"
        />
        <q-tab
            v-if="!contract"
            name="nfts"
            class="c-address__tabs-tab"
            :label="$t('components.nfts.nfts')"
        />
        <q-tab
            v-if="
                !contract
                    && isLoggedIn
                    && toChecksumAddress(accountAddress) === toChecksumAddress(address)
            "
            name="approvals"
            class="c-address__tabs-tab"
            :label="$t('pages.approvals')"
        />
        <q-tab
            name="tokentxns"
            class="c-address__tabs-tab"
            :label="$t('pages.erc20_transfers')"
        />
        <q-tab
            name="erc721txns"
            class="c-address__tabs-tab"
            :label="$t('pages.erc721_transfers')"
        />
        <q-tab
            name="erc1155txns"
            class="c-address__tabs-tab"
            :label="$t('pages.erc1155_transfers')"
        />
        <q-tab
            v-if="contract"
            name="contract"
            class="c-address__tabs-tab c-address__tabs-tab--with-icon"
            :label="$t('pages.contract')"
        >
            <q-icon
                :class="{
                    'c-address__tabs-tab-icon': true,
                    'c-address__tabs-tab-icon--selected': tab === 'contract',
                    'c-address__tabs-tab-icon--verified fas fa-check-circle': contract?.isVerified(),
                    'c-address__tabs-tab-icon--unverified fa fa-exclamation-triangle': !contract?.isVerified(),
                }"
            />
        </q-tab>
    </q-tabs>
    <div class="q-mb-md">
        <q-tab-panels
            ref="panels"
            :key="address"
            v-model="tab"
            class="c-address__panels"
            animated
            transition-next="fade"
            transition-prev="fade"
            keep-alive
        >
            <q-tab-panel
                name="transactions"
                class="c-address__panel c-address__panel-transactions"
            >
                <TransactionTable
                    v-if="accountAddress"
                    :title="accountAddress"
                    :account-address="accountAddress"
                />
                <ExportLink
                    class="c-address__panel-export-link"
                    :account="accountAddress"
                    :type="EXPORT_DOWNLOAD_TYPES.transactions"
                    :ariaLabel="$t('components.export.download_transactions_csv')"
                />
            </q-tab-panel>
            <q-tab-panel
                v-if="contract && contract.supportedInterfaces?.includes('erc721')"
                name="collection"
                class="c-address__panel c-address__panel-collection"
            >
                <NFTList :address="contract.address" filter="contract" />
            </q-tab-panel>
            <q-tab-panel
                v-if="contract && contract.isToken()"
                name="holders"
                class="c-address__panel c-address__panel-holders"
            >
                <HolderList :contract="contract" />
            </q-tab-panel>
            <q-tab-panel
                v-else
                name="internaltx"
                class="c-address__panel c-address__panel-internaltx"
            >
                <InternalTransactionTable :title="accountAddress" :filter="{address:accountAddress}"/>
            </q-tab-panel>
            <q-tab-panel
                v-if="
                    !contract
                        && isLoggedIn
                        && toChecksumAddress(accountAddress) === toChecksumAddress(address)
                "
                name="approvals"
                class="c-address__panel c-address__panel-approvals"
            >
                <ApprovalList type="erc20" :accountAddress="accountAddress" />
            </q-tab-panel>
            <q-tab-panel
                name="nfts"
                class="c-address__panel c-address__panel-nfts"
            >
                <NFTList :address="accountAddress" filter="account" />
            </q-tab-panel>
            <q-tab-panel
                name="tokens"
                class="c-address__panel c-address__panel-tokens"
            >
                <TokenList :address="accountAddress"/>
            </q-tab-panel>
            <q-tab-panel
                name="tokentxns"
                class="c-address__panel c-address__panel-tokentxns"
            >
                <NftTransfersTable
                    title="ERC-20 Transfers"
                    token-type="erc20"
                    :initialPageSize="10"
                    :address="accountAddress"
                />
                <ExportLink
                    class="c-address__panel-export-link"
                    :account="accountAddress"
                    :type="EXPORT_DOWNLOAD_TYPES.erc20Transfers"
                    :ariaLabel="$t('components.export.download_erc_20_transfers_csv')"
                />
            </q-tab-panel>
            <q-tab-panel
                name="erc721txns"
                class="c-address__panel c-address__panel-erc721txns"
            >
                <NftTransfersTable
                    title="ERC-721 Transfers"
                    token-type="erc721"
                    :initialPageSize="10"
                    :address="accountAddress"
                />
                <ExportLink
                    class="c-address__panel-export-link"
                    :account="accountAddress"
                    :type="EXPORT_DOWNLOAD_TYPES.erc721Transfers"
                    :ariaLabel="$t('components.export.download_erc_721_transfers_csv')"
                />
            </q-tab-panel>
            <q-tab-panel
                name="erc1155txns"
                class="c-address__panel c-address__panel-erc1155txns"
            >
                <NftTransfersTable
                    title="ERC-1155 Transfers"
                    token-type="erc1155"
                    :initialPageSize="10"
                    :address="accountAddress"
                />
                <ExportLink
                    class="c-address__panel-export-link"
                    :account="accountAddress"
                    :type="EXPORT_DOWNLOAD_TYPES.erc1155Transfers"
                    :ariaLabel="$t('components.export.download_erc_1155_transfers_csv')"
                />
            </q-tab-panel>
            <q-tab-panel v-if="contract" name="contract">
                <ContractTab v-if="contract.isVerified()" :contract="contract"/>
                <GenericContractInterface v-else  :contract="contract" />
            </q-tab-panel>
        </q-tab-panels>
    </div>
</div>
</template>

<style lang="scss">
.c-address {
    @include page-container;

    &__info-container{
        margin-bottom: 2.5rem;
    }

    &__tabs {
        @include tabs-container;

        &-tab {
            $tab: &;
            height: 32px;
            margin-top: auto;
            margin-bottom: auto;

            &--with-icon {
                .q-tab__content {
                    flex-direction: row;
                    flex-wrap: nowrap;
                }
            }


            &-icon {
                margin-left: 6px;
                &--verified {
                    color: var(--q-positive);
                }

                &--unverified {
                    color: var(--q-warning);
                }
            }
        }
    }

    &__header {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    &__header-text-container {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        max-width: 100%;
    }

    &__title {
        font-size: 1.4rem;
        font-weight: bold;
    }

    &__hex {
        font-size: 0.85rem;
        word-break: break-all;

        @media screen and (min-width: $breakpoint-md-min) {
            font-size: 1rem;
        }
    }

    &__coin-icon {
        width: 24px;
        height: 24px;
    }

    &__panels {
        background: transparent;
        --v-overflow: visible;
        overflow: visible !important;
    }

    &__panel {
        padding: 0;
        text-align: end;
        &-export-link {
            background-color: var(--invert-text-color);
            border-radius: 12px;
            padding: 12px;
            margin-top: 10px;
            margin-right: 0px;
        }
    }
}
</style>
