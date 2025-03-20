<script setup lang="ts">
import { ref, computed, onMounted, toRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ContractSource from 'components/ContractTab/ContractSource.vue';
import ContractInterface from 'components/ContractTab/ContractInterface.vue';
import CopyButton from 'components/CopyButton.vue';
import { getCore, useChainStore } from 'src/core';
import { toChecksumAddress, ZERO_ADDRESSES } from 'src/lib/utils';
import AddressField from 'components/AddressField.vue';
import { ethers } from 'ethers';

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
const useImplementation = ref(false);
const isProxy = ref(false);
const checkingProxy = ref(false);
const proxyType = ref('none');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proxyImplementation = ref<any>(null);
const tab = ref('source');

type TabValue = 'source' | 'read' | 'write' | 'read_proxy' | 'write_proxy';

// Set initial values based on URL query
onMounted(async () => {
    const subtab = (route.query.subtab as string) || 'source';
    selectTab(subtab as TabValue);
    await checkProxy();
});

const verified = computed(() => props.contract.verified);
const abi = computed(() => {
    if (!props.contract.abi || !Array.isArray(props.contract.abi)) {
        return false;
    }
    return JSON.stringify(props.contract.abi);
});

const contractToShowInterface = computed(() => {
    const interactionContract = { ...toRaw(props.contract) };
    if (useImplementation.value && proxyImplementation.value) {
        interactionContract.abi = proxyImplementation.value.abi;
    }
    return interactionContract;
});

const checkProxy = async () => {
    checkingProxy.value = true;
    const web3Provider = await getCore().wallets.getWeb3Provider();
    // Storage slot for the implementation address according to EIP-1967
    const eip1967Slot =
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
    // Admin slot used by Transparent Upgradeable Proxy (e.g., from zeppelinOS)
    const adminSlot =
        '0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b';
    // Implementation slot used by Transparent Upgradeable Proxy (e.g., from zeppelinOS)
    const zeppelinOSSlot =
        '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3';

    if (proxyType.value === 'none') {
        // Attempt to detect UUPS (EIP-1822) by calling the 'proxiableUUID()' function
        try {
            // Create an interface for the function proxiableUUID()
            const iface = new ethers.utils.Interface([
                'function proxiableUUID() view returns (bytes32)',
            ]);
            // Encode the function call
            const data = iface.encodeFunctionData('proxiableUUID');
            // Make the call against the proxy address
            const rawReturn = await web3Provider.call({
                to: props.contract.address,
                data: data,
            });
            // Decode the returned value
            const proxiableUUID = iface.decodeFunctionResult('proxiableUUID', rawReturn)[0];
            // If the call succeeds and the returned value matches the expected slot,
            // assume the contract is a UUPS proxy (EIP-1822)
            if (proxiableUUID && proxiableUUID.toLowerCase() === eip1967Slot) {
                // Retrieve the implementation address by reading the EIP-1967 slot
                const storageValue = await web3Provider.getStorageAt(
                    props.contract.address,
                    eip1967Slot,
                );
                // Extract the last 20 bytes (40 hex characters) from the 32-byte string
                const rawAddress = '0x' + storageValue.slice(26);
                if (rawAddress.toLowerCase() !== ZERO_ADDRESSES) {
                    const checksumImplementation = toChecksumAddress(rawAddress);
                    proxyImplementation.value = await useChainStore()
                        .currentChain.settings.getContractManager()
                        .getContract(checksumImplementation, true);
                    proxyType.value = 'EIP-1822';
                    isProxy.value = true;
                }
            }
        } catch (err) {
            console.debug('We rule out that it is a UUPS proxy (EIP-1822)');
        }
    }

    if (proxyType.value === 'none') {
        // Attempt to detect as Transparent proxy (EIP-1967)
        try {
            const storageValue = await web3Provider.getStorageAt(
                props.contract.address,
                eip1967Slot,
            );
            // Extract the implementation address
            const rawAddress = '0x' + storageValue.slice(26);
            if (rawAddress.toLowerCase() !== ZERO_ADDRESSES) {
                proxyImplementation.value = await useChainStore()
                    .currentChain.settings.getContractManager()
                    .getContract(toChecksumAddress(rawAddress), true);
                isProxy.value = true;
                proxyType.value = 'EIP-1967';
            }
        } catch (err) {
            console.error('Error reading storage slot for proxy detection:', err);
        }
    }

    if (proxyType.value === 'none') {
        // Attempt to detect as Transparent Upgradeable Proxy
        try {
            const adminValue = await web3Provider.getStorageAt(
                props.contract.address,
                adminSlot,
            );
            const storageValue = await web3Provider.getStorageAt(
                props.contract.address,
                zeppelinOSSlot,
            );
            // Extract the implementation address
            const impAddress = '0x' + storageValue.slice(26);
            // Extract the admin address
            const adminAddress = '0x' + adminValue.slice(26);
            // If both the implementation and admin addresses are set, assume it's a Transparent Upgradeable Proxy
            if (impAddress.toLowerCase() !== ZERO_ADDRESSES && adminAddress.toLowerCase() !== ZERO_ADDRESSES) {
                proxyImplementation.value = await useChainStore()
                    .currentChain.settings.getContractManager()
                    .getContract(toChecksumAddress(impAddress), true);
                isProxy.value = true;
                proxyType.value = 'EIP-1967-ZOS';
            }
        } catch (err) {
            console.error('Error reading storage slot for proxy detection:', err);
        }
    }

    checkingProxy.value = false;
};

const selectTab = (value: TabValue) => {
    source.value = false;
    useImplementation.value = false;
    write.value = false;
    switch (value) {
    case 'source':
        source.value = true;
        break;
    case 'read':
        break;
    case 'write':
        write.value = true;
        break;
    case 'read_proxy':
        useImplementation.value = true;
        break;
    case 'write_proxy':
        write.value = true;
        useImplementation.value = true;
        break;
    default:
        source.value = true;
        break;
    }
    tab.value = value;
    router.push({ query: { ...route.query, subtab: value } });
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
                        'c-contract__tab--active': tab === 'source',
                    }"
                    @click="selectTab('source')"
                />
                <q-btn
                    :label="$t('components.contract_tab.read')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': tab === 'read',
                    }"
                    @click="selectTab('read')"
                />
                <q-btn
                    :label="$t('components.contract_tab.write')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': tab === 'write',
                    }"
                    @click="selectTab('write')"
                />
                <q-btn
                    v-if="isProxy"
                    :label="$t('components.contract_tab.read_proxy')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': tab === 'read_proxy',
                    }"
                    @click="selectTab('read_proxy')"
                />
                <q-btn
                    v-if="isProxy"
                    :label="$t('components.contract_tab.write_proxy')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': tab === 'write_proxy',
                    }"
                    @click="selectTab('write_proxy')"
                />
                <div v-if="checkingProxy" class="c-contract__spinner-container-small">
                    <q-spinner class="c-contract__spinner-small" />
                    {{ $t('components.contract_tab.detecting_proxy') }}
                </div>
            </div>

            <div v-if="isProxy && proxyImplementation" class="c-contract__is-proxy text-grey">
                <span>
                    {{ $t('components.contract_tab.proxy_contract', { type: proxyType }) }}
                    <q-tooltip>
                        {{ $t('components.contract_tab.proxy_contract_tooltip') }}
                    </q-tooltip>
                </span>
                <AddressField :address="proxyImplementation.address" :truncate="18" />
            </div>
            <CopyButton
                v-if="verified && !contract?.autoloadedAbi"
                :text="abi"
                :accompanying-text="$t('components.contract_tab.copy_abi_to_clipboard')"
                class="c-contract__copy-button"
            />
        </div>
        <div
            v-if="!contractToShowInterface"
            class="c-contract__spinner-container"
        >
            <q-spinner class="c-contract__spinner" />
        </div>
        <template v-else>
            <ContractSource v-if="source" :contract="contract"/>
            <ContractInterface
                v-else
                :write="write"
                :contract="contractToShowInterface"
            />
        </template>
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
        margin-bottom: 20px;
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

    &__is-proxy {
        display: flex;
        flex-direction: column;
        min-width: 400px;
        align-items: end;
        // in mobile view align to start
        @media screen and (max-width: 950px) {
            align-items: start;
            margin-bottom: 20px;
        }
    }

    &__spinner {
        height: 30px;
        width: 30px;
        &-small {
            margin-left: 10px;
            height: 20px;
            width: 20px;
        }
    }

    &__spinner-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
        &-small {
            display: flex;
            gap: 10px;
            justify-items: center;
            align-items: anchor-center;
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
