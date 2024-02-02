<script>
import Web3 from 'web3';

import ContractSource from 'components/ContractTab/ContractSource';
import ContractInterface from 'components/ContractTab/ContractInterface';
import CopyButton from 'components/CopyButton.vue';

const TABS = {
    source: 'source',
    read: 'read',
    write: 'write',
    proxyRead: 'proxyRead',
    proxyWrite: 'proxyWrite',
};

export default {
    name: 'ContractTab',
    components: {
        ContractSource,
        ContractInterface,
        CopyButton,
    },
    props: {
        contract: {
            type: Object,
            default: () => ({}),
        },
    },
    data: () => ({
        selectedTab: TABS.source,
        loading: true,
        proxyContractAddress: '',
        TABS,
    }),
    async mounted() {
        const contractAddress = this.contract.address;

        const web3 = new Web3(process.env.NETWORK_EVM_RPC);

        // Slot for the implementation address
        const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

        async function checkEIP1967Implementation() {
            const implementationAddressBytes = await web3.eth.getStorageAt(contractAddress, implementationSlot);
            // Extract the last 40 characters (20 bytes) to get the actual address
            const implementationAddress = implementationAddressBytes !== '0x0' ? '0x' + implementationAddressBytes.slice(-40) : null;

            return implementationAddress ?? '';
        }

        this.proxyContractAddress = await checkEIP1967Implementation(this);
        this.loading = false;
    },
    computed: {
        abi() {
            const { abi } = this.contract;

            if (!Array.isArray(abi)) {
                return '';
            }

            return JSON.stringify(this.contract.abi);
        },
        contractIsProxy() {
            return !!this.proxyContractAddress;
        },
    },
};
</script>

<template>
<div class='contract-tab'>
    <div v-if='loading' class='text-center'>
        <q-spinner
            size='md'
            class='q-ma-xl'
        />
    </div>

    <template v-else>
        <CopyButton
            v-if='abi'
            :text='abi'
            :accompanying-text="$t('components.contract_tab.copy_abi_to_clipboard')"
            class='q-mb-md'
        />

        <br>

        <q-btn-group>
            <q-btn
                :outline="selectedTab === TABS.source"
                :label="$t('components.contract_tab.code')"
                push
                @click='selectedTab = TABS.source'
            />
            <q-btn
                :outline="selectedTab === TABS.read"
                :label="$t('components.contract_tab.read')"
                push
                @click="selectedTab = TABS.read"
            />
            <q-btn
                :outline="selectedTab === TABS.write"
                :label="$t('components.contract_tab.write')"
                push
                @click="selectedTab = TABS.write"
            />
            <!-- eztodo i18n -->
            <q-btn
                v-if="contractIsProxy"
                :outline="selectedTab === TABS.proxyRead"
                :label="'Read as Proxy'"
                push
                @click="selectedTab = TABS.proxyRead"
            />
            <q-btn
                v-if="contractIsProxy"
                :outline="selectedTab === TABS.proxyWrite"
                :label="'Write as Proxy'"
                push
                @click="selectedTab = TABS.proxyWrite"
            />
        </q-btn-group>

        <ContractSource v-if="selectedTab === TABS.source" />
        <ContractInterface
            v-else
            :write="[TABS.write, TABS.proxyWrite].includes(selectedTab)"
            :showProxyOwnFunctions="[TABS.read, TABS.write].includes(selectedTab)"
            :proxy="proxyContractAddress"
        />
    </template>
</div>
</template>

<style lang='sass'>
.contract-tab
    margin-left: 2rem
    margin-right: 2rem
    padding-top: 1rem
</style>
