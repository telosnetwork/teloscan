<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { contractManager } from 'src/boot/telosApi';
import { indexerApi } from 'src/boot/telosApi';
import { evm } from 'src/boot/evm';
import { toChecksumAddress, formatWei } from 'src/lib/utils';
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
import ConfirmationDialog from 'components/ConfirmationDialog.vue';
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

const accountLoading = ref(false);
const title = ref('');
const fullTitle = ref('');
const telosAccount = ref('');
const balance = ref('0');
const nonce = ref<number | null>(null);
const contract = ref<Contract | null>(null);
const creationDate = ref(0);
const tab = ref('transactions');
const confirmationDialog = ref(false);

const accountAddress = computed(() => route.params.address as string ?? '');
const isLoggedIn = computed(() => store.getters['login/isLoggedIn']);
const address = computed(() => store.getters['login/address']);

watch(accountAddress, async (newVal, oldVal) => {
    if (newVal !== oldVal) {
        const newAsChecksum = toChecksumAddress(newVal);
        if (newAsChecksum !== newVal) {
            router.replace({ params: { address: newAsChecksum } });
        }
        await loadAccount();
    }
}, { deep: true, immediate: true });

onMounted(() => {
    if (route.hash !== `#${tab.value}`){
        router.replace({ hash: '#transactions' });
    }
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
        if(contract.value?.getCreationBlock()){
            const response = await indexerApi.get(`/block/${contract.value.getCreationBlock()}`);
            creationDate.value = response.data.results[0]?.timestamp;
        }
        if (contract.value?.getName()) {
            fullTitle.value = contract.value.getName() ?? '';
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

function disableConfirmation(){
    confirmationDialog.value = false;
}

</script>

<template>
<div v-if="accountAddress && !accountLoading" :key="accountAddress" class="c-address q-pt-xl">
    <div>
        <div class="row tableWrapper justify-between q-mb-lg">
            <div class="homeInfo">
                <div class="flex">
                    <q-img
                        v-if="contract && contract.supportedInterfaces?.includes('erc20')"
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
                            class="c-address__copy"
                        />
                        <AddressQR
                            v-if="accountAddress"
                            :address="accountAddress"
                            class="c-address__qr-code"
                        />
                        <q-tooltip v-if="fullTitle">{{ fullTitle }} </q-tooltip>
                    </div>
                    <div v-if="contract">
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
                        <q-tooltip v-if="contract?.isVerified()">
                            {{ $t('components.contract_tab.verified_contract') }}
                        </q-tooltip>
                        <q-tooltip v-else>{{ $t('components.contract_tab.unverified_contract') }} </q-tooltip>
                    </div>
                </div>
                <div class="flex">
                    <div class="flex c-address__overview">
                        <AddressOverview :balance="balance" class="c-address__overview--full-width"/>
                    </div>
                    <div v-if="contract" class="flex c-address__overview">
                        <ContractMoreInfo :address="contract?.getCreator() ?? ''" :transaction="contract?.getCreationTrx() ?? ''"  class="c-address__overview--full-width"/>
                    </div>
                    <div v-else class="flex c-address__overview">
                        <AddressMoreInfo :address="accountAddress"  class="c-address__overview--full-width"/>
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
                                    <span v-if="parseFloat(contract.properties.price) < 0.0001">{{ '< 0.0001 $' }}</span>
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
            dense
            class="c-address__tabs"
            active-class="c-address__tabs-tab--active"
            content-class="c-address__tabs-content"
            indicator-color="transparent"
        >
            <q-route-tab
                name="transactions"
                class="c-address__tabs-tab"
                :to="{ hash: '#transactions' }"
                :label="$t('pages.transactions.transactions')"
            />
            <q-route-tab
                v-if="contract && contract.supportedInterfaces.includes('erc721')"
                name="collection"
                class="c-address__tabs-tab"
                :to="{ hash: '#collection' }"
                :label="$t('components.nfts.collection')"
            />
            <q-route-tab
                v-if="contract && contract.isToken()"
                name="holders"
                class="c-address__tabs-tab"
                :to="{ hash: '#holders' }"
                :label="$t('pages.holders')"
            />
            <q-route-tab
                v-if="contract && !contract.isToken()"
                name="internaltx"
                class="c-address__tabs-tab"
                :to="{ hash: '#internaltx' }"
                :label="$t('pages.internal_txns')"
            />
            <q-route-tab
                name="tokens"
                class="c-address__tabs-tab"
                :to="{ hash: '#tokens' }"
                :label="$t('pages.tokens')"
            />
            <q-route-tab
                v-if="!contract"
                name="nfts"
                class="c-address__tabs-tab"
                :to="{ hash: '#nfts' }"
                :label="$t('components.nfts.nfts')"
            />
            <q-route-tab
                v-if="
                    !contract
                        && isLoggedIn
                        && toChecksumAddress(accountAddress) === toChecksumAddress(address)
                "
                name="approvals"
                class="c-address__tabs-tab"
                :to="{ hash: '#approvals' }"
                :label="$t('pages.approvals')"
            />
            <q-route-tab
                name="tokentxns"
                class="c-address__tabs-tab"
                :to="{ hash: '#tokentxns' }"
                :label="$t('pages.erc20_transfers')"
            />
            <q-route-tab
                v-if="contract"
                name="contract"
                class="c-address__tabs-tab"
                :to="{ hash: '#contract' }"
                :label="$t('pages.contract')"
            />
            <q-icon v-if="contract && contract.isVerified()" class="fas fa-check-circle text-positive c-address__verification-icon"/>
        </q-tabs>
        <div class="q-mb-md c-address__table-wrapper">
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
</div>
</template>

<style scoped lang="scss">
.c-address{
    padding-top: 30px;

    &__tabs {
        @include tabs-container;
        height: 50px;
        margin-bottom: .5rem;

        &-tab{
            height: 35px;
            margin-top: auto;
            margin-bottom: auto;
            margin-right:.5rem;
        }
    }
    &__copy{
        display: inline;
        font-size: 16px;
    }
    &__overview{
        width: 50%;
        &--full-width{
            width:100%;
            margin:.5rem;
        }
    }
    &__table-wrapper{
        width: 1200px;
    }
    &__verification-icon{
        position: absolute;
        top: -0.35rem;
        right: 0.3rem;
    }
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

.text-primary {
  display: inline-block;
}

@media only screen and (max-width: 1200px) {
  .dataCardsContainer .dataCardData span {
    font-size: 1rem;
  }
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
//   .tableWrapper {
//     justify-content: center;
//   }
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
