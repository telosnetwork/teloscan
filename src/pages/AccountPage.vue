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
import TransferTable from 'components/TransferTable.vue';
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

const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useStore();

const tabs = ['transactions', 'collection', 'holders', 'internaltx', 'tokens', 'nfts', 'approvals', 'tokentxns', 'contract'];

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
    const cachedContract = await contractManager.getContract(accountAddress.value);
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
                    <q-tooltip v-if="fullTitle">{{ fullTitle }} </q-tooltip>
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
    <div class="row q-mb-lg q-col-gutter-md">
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
            v-if="contract"
            name="contract"
            :class="{
                'c-address__tabs-tab': true,
                'c-address__tabs-tab--with-icon': contract?.isVerified(),
            }"
            :label="$t('pages.contract')"
        >
            <q-icon v-if="contract && contract.isVerified()" class="fas fa-check-circle text-positive q-ml-xs" />
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
            <q-tab-panel v-else name="internaltx">
                <InternalTransactionTable :title="accountAddress" :filter="{accountAddress}"/>
            </q-tab-panel>
            <q-tab-panel
                v-if="
                    !contract
                        && isLoggedIn
                        && toChecksumAddress(accountAddress) === toChecksumAddress(address)
                "
                name="approvals"
            >
                <ApprovalList type="erc20" :accountAddress="accountAddress" />
            </q-tab-panel>
            <q-tab-panel name="nfts">
                <NFTList :address="accountAddress" filter="account" />
            </q-tab-panel>
            <q-tab-panel name="tokens">
                <TokenList :address="accountAddress"/>
            </q-tab-panel>
            <q-tab-panel name="tokentxns">
                <TransferTable
                    title="ERC-20 Transfers"
                    token-type="erc20"
                    :initialPageSize="10"
                    :address="accountAddress"
                />
            </q-tab-panel>
            <q-tab-panel v-if="contract" name="contract">
                <ContractTab v-if="contract.abi?.length > 0" :contract="contract"/>
                <GenericContractInterface v-else  :contract="contract" />
            </q-tab-panel>
        </q-tab-panels>
    </div>
</div>
</template>

<style lang="scss">
.c-address {
    @include page-container;

    &__tabs {
        @include tabs-container;
        height: 50px;
        margin-bottom: .7rem;

        &-tab {
            height: 35px;
            margin-top: auto;
            margin-bottom: auto;

            &--with-icon {
                padding-right: 32px;
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

    // quasar overrides
    .q-tab-panel {
        padding: 0;
    }
}
</style>
