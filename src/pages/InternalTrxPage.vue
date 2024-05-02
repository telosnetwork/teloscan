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
import InternalTransactionFlatTable from 'components/InternalTransactionFlatTable.vue';
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


const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useStore();

const loading = ref(false);
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
<q-page class="c-internal-trx">

    <div class="c-internal-trx__header">
        <span class="c-internal-trx__header-title">{{ $t('pages.internaltrx.page_title') }}</span>
        <span class="c-internal-trx__header-sub-title">{{ $t('pages.internaltrx.for_address', { address: address }) }}</span>
    </div>

    <div class="c-internal-trx__body">
        <q-card>
            <q-toggle
                v-model="showEmptyBlocks"
                class="c-internal-trx__toggle"
                label="display empty blocks"
                color="primary"
                checked-icon="visibility"
                unchecked-icon="visibility_off"
            />
            <BlockTable :showEmptyBlocks='showEmptyBlocks' class="c-internal-trx__block-table" :title="'Block List'"/>
        </q-card>
    </div>

</q-page>
</template>

<style lang="scss">

.c-internal-trx {
    @include page-container;

    &__header {
        @include page-header;
    }

    &__tabs {
        @include tabs-container;
    }

    &__main-container {
        background: transparent !important;
    }
    &__main-content {
        padding: 0px;
    }
    &__panels {
        background: transparent;
        --v-overflow: visible;
        overflow: visible !important;
    }
    &__panel {
        padding: 0px;
    }
}

</style>
