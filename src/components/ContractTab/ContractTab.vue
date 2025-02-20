<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ContractSource from 'components/ContractTab/ContractSource.vue';
import ContractInterface from 'components/ContractTab/ContractInterface.vue';
import CopyButton from 'components/CopyButton.vue';
import { getCore, useChainStore } from 'src/core';
import { toChecksumAddress, ZERO_ADDRESSES } from 'src/lib/utils';
import AddressField from 'components/AddressField.vue';

const props = defineProps({
    contract: {
        type: Object,
        default: () => ({}),
    },
});

const route = useRoute();
const router = useRouter();

const source = ref(true);
const write = ref(false);
const isProxy = ref(false);
const proxyImplementation = ref(ZERO_ADDRESSES);
const proxyImplementationAbi = ref([]);

type TabValue = 'source' | 'read' | 'write';

// Set initial values based on URL query
onMounted(async () => {
    const subtab = route.query.subtab as string || 'source';
    switch (subtab) {
    case 'read':
        source.value = false;
        write.value = false;
        break;
    case 'write':
        source.value = false;
        write.value = true;
        break;
    case 'read_proxy':
        source.value = false;
        write.value = false;
        break;
    case 'write_proxy':
        source.value = false;
        write.value = true;
        break;
    default:
        source.value = true;
        write.value = false;
        break;
    }

    await checkProxy();
});

const verified = computed(() => props.contract.verified);
const abi = computed(() => {
    if (!props.contract.abi || !Array.isArray(props.contract.abi)) {
        return false;
    }
    return JSON.stringify(props.contract.abi);
});

const codeSelected = computed(() => source.value === true);
const readSelected = computed(() => source.value === false && write.value === false);
const writeSelected = computed(() => source.value === false && write.value === true);

const getContractAbi = () => {
    if (isProxy.value) {
        return {
            abi: proxyImplementationAbi.value,
            address: props.contract.address,
        };
    }
    return props.contract;
};

const checkProxy = async () => {
    const web3Provider = await getCore().wallets.getWeb3Provider();
    // --- Detect if the contract is a proxy by reading the EIP-1967 slot ---
    try {
        // Storage slot for EIP-1967 proxy impl:
        // 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
        const eip1967Slot =
            '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

        // Read the slot from the contract’s address.
        const storageValue = await web3Provider.getStorageAt(
            props.contract.address,
            eip1967Slot,
        );
        // storageValue will be a 32-byte hex string, e.g.:
        // "0x000000000000000000000000<implAddressInLast20Bytes>..."

        // Extract the last 20 bytes (40 hex chars) from the 32-byte value.
        // Example: storageValue.slice(26) (after 2 chars for "0x" + 24 zeroes = 26)
        const rawAddress = '0x' + storageValue.slice(26);

        if (rawAddress.toLowerCase() !== ZERO_ADDRESSES) {
            const checksumImplementation = toChecksumAddress(rawAddress);
            const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
            isProxy.value = true;
            proxyImplementation.value = checksumImplementation;
            // Fetch the ABI of the implementation contract.
            const contractResponse = await indexerApi.get(`/v1/contract/${rawAddress}`);
            proxyImplementationAbi.value = contractResponse.data.contracts[checksumImplementation].abi;
        }
    } catch (err) {
        console.error('Error reading storage slot for proxy detection:', err);
    }
};

const selectTab = (tab: TabValue) => {
    switch (tab) {
    case 'read':
        source.value = false;
        write.value = false;
        break;
    case 'write':
        source.value = false;
        write.value = true;
        break;
    default:
        source.value = true;
        write.value = false;
        break;
    }
    router.push({ query: { ...route.query, subtab: tab } });
};

</script>

<template>
<q-card class="c-contract">
    <div v-if="abi" :key="contract.address + abi.length">
        <div class="flex justify-between items-center">
            <div class="c-contract__tab-container">
                <q-btn
                    :label="$t('components.contract_tab.code')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': codeSelected,
                    }"
                    @click="selectTab('source')"
                />
                <q-btn
                    :label="$t('components.contract_tab.read')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': readSelected,
                    }"
                    @click="selectTab('read')"
                />
                <q-btn
                    :label="$t('components.contract_tab.write')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': writeSelected,
                    }"
                    @click="selectTab('write')"
                />
                <q-btn
                    v-if="isProxy"
                    :label="$t('components.contract_tab.read_proxy')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': readSelected,
                    }"
                    @click="selectTab('read_proxy')"
                />
                <q-btn
                    v-if="isProxy"
                    :label="$t('components.contract_tab.write_proxy')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': writeSelected,
                    }"
                    @click="selectTab('write_proxy')"
                />
            </div>
            <div v-if="isProxy" class="text-grey">
                <span>
                    {{ $t('components.contract_tab.proxy_contract') }}
                    <q-tooltip>
                        {{ $t('components.contract_tab.proxy_contract_tooltip') }}
                    </q-tooltip>
                </span>
                <AddressField :address="proxyImplementation" :truncate="18" />
            </div>
            <CopyButton
                v-if="verified && !contract?.autoloadedAbi"
                :text="abi"
                :accompanying-text="$t('components.contract_tab.copy_abi_to_clipboard')"
            />
        </div>
        <ContractSource v-if="source" :contract="contract"/>
        <ContractInterface
            v-else
            :write="write"
            :contract="getContractAbi()"
        />
    </div>
</q-card>
</template>

<style lang='scss' scoped>
.c-contract {
    padding-top: 1rem;
    padding-left: 1rem;
    padding-right: 1rem;

    &__tab-container {
        display: inline-flex;
        gap: .5rem;
    }

    &__tab {
        cursor: pointer;
        border-radius: 5px;
        color: var(--text-color);
        text-transform: capitalize !important;
        background-color: var(--tab-bg-color);

        &:hover {
            color: var(--text-color);
        }

        &--active {
            color: var(--active-tab-text-color);
            background-color: var(--active-tab-bg-color);
        }
    }

    .vjs-tree-list-holder-inner {
        padding-bottom: 20px;
    }
}

@media screen and (max-width: 764px) {
    .c-contract > .items-center .c-copy-button {
        margin-top: 12px;
    }

    .c-contract > .items-center {
        display: block;
    }
}
</style>
