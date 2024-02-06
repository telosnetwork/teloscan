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
        contractInterfaceKey: 0,
    }),
    mounted() {
        this.checkIsProxy();
    },
    computed: {
        contractAddress() {
            return this.contract?.address ?? '';
        },
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
    watch: {
        contractAddress() {
            this.checkIsProxy();
        },
    },
    methods: {
        async checkEIP1967Implementation() {
            if (!this.contractAddress) {
                return '';
            }

            const web3 = new Web3(process.env.NETWORK_EVM_RPC);

            // Slot for the implementation address
            // equivalent to `keccak256("eip1967.proxy.implementation") - 1`
            const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
            const implementationAddressBytes = await web3.eth.getStorageAt(this.contractAddress, implementationSlot);
            // Extract the last 40 characters (20 bytes) to get the actual address
            return implementationAddressBytes !== '0x0' ? '0x' + implementationAddressBytes.slice(-40) : '';
        },
        async checkIsProxy() {
            this.loading = true;
            this.proxyContractAddress = await this.checkEIP1967Implementation();
            this.loading = false;
        },
        getImplContractAddress() {
            return (
                [TABS.proxyWrite, TABS.proxyRead].includes(this.selectedTab) &&
                this.proxyContractAddress
            ) ? this.proxyContractAddress : null;
        },
        async handleFunctionRun() {
            if (this.proxyContractAddress) {
                await this.checkIsProxy();
                this.contractInterfaceKey += 1;
            }
        },
    },
};
</script>

<template>
<div class="contract-tab">
    <div v-if="loading" class="text-center">
        <q-spinner
            size="md"
            class="q-ma-xl"
        />
    </div>

    <template v-else>
        <CopyButton
            v-if="abi"
            :text="abi"
            :accompanying-text="$t('components.contract_tab.copy_abi_to_clipboard')"
            class="q-mb-md"
        />

        <br>

        <q-btn-group>
            <q-btn
                :outline="selectedTab === TABS.source"
                :label="$t('components.contract_tab.code')"
                push
                @click="selectedTab = TABS.source"
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
            <q-btn
                v-if="contractIsProxy"
                :outline="selectedTab === TABS.proxyRead"
                :label="$t('components.contract_tab.read_as_proxy')"
                push
                @click="selectedTab = TABS.proxyRead"
            />
            <q-btn
                v-if="contractIsProxy"
                :outline="selectedTab === TABS.proxyWrite"
                :label="$t('components.contract_tab.write_as_proxy')"
                push
                @click="selectedTab = TABS.proxyWrite"
            />
        </q-btn-group>

        <ContractSource v-if="selectedTab === TABS.source" />
        <ContractInterface
            v-else
            :key="contractInterfaceKey"
            :write="[TABS.write, TABS.proxyWrite].includes(selectedTab)"
            :implementation-contract-address="getImplContractAddress()"
            @function-run="handleFunctionRun"
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
