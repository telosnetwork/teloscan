<template>
<div class="q-pa-md">
    <div class="row q-pb-md">
        <div class="col-12">
            <p>
                <q-icon
                    name="warning"
                    class="text-red"
                    size="1.25rem"
                ></q-icon>
                This contract source has not been verified.
            </p>
            <p>
                Click <router-link :to="{ name: 'sourcify' }">here</router-link>
                to upload source files and verify this contract.
                Alternatively, you can interact with the contract using an arbitrary ABI:
            </p>
        </div>
    </div>

    <div class="row q-pb-lg">
        <div class="col-12">
            <q-btn-group push>
                <q-btn
                    push
                    no-caps
                    :outline="selectedAbi === abiOptions.erc20"
                    @click="selectedAbi = abiOptions.erc20"
                >
                    Use ERC20 ABI
                </q-btn>
                <q-btn
                    push
                    no-caps
                    :outline="selectedAbi === abiOptions.erc721"
                    @click="selectedAbi = abiOptions.erc721"
                >
                    Use ERC721 ABI
                </q-btn>
                <q-btn
                    push
                    no-caps
                    :outline="selectedAbi === abiOptions.custom"
                    @click="selectedAbi = abiOptions.custom"
                >
                    ABI from JSON
                </q-btn>
            </q-btn-group>
        </div>
    </div>

    <div class="row q-mb-xl" v-if="selectedAbi === abiOptions.custom">
        <div class="col-sm-12 col-md-10 col-lg-8 col-xl-6">
            <q-input
                v-model="customAbiDefinition"
                clearable
                name="custom-abi"
                label="Paste ABI JSON here"
                class="q-pb-lg"
            />

            <template v-if="!!customAbiDefinition && customAbiIsValidJSON">
                <p class="q-mb-sm">ABI JSON Preview</p>
                <JsonViewer
                    :value="JSON.parse(customAbiDefinition)"
                    :expand-depth="1"
                    expanded
                    theme="custom-theme"
                />
            </template>
            <p v-else-if="!!customAbiDefinition" class="text-red">
                invalid ABI JSON
            </p>
            <!-- add error msg for invalid abi json -->
        </div>
    </div>

    <div class="row" v-if="showAbiFunctions">
        <div class="col-12">
            <q-btn-group>
                <q-btn
                    no-caps
                    :outline="displayWriteFunctions === false"
                    @click="displayWriteFunctions = false"
                >
                    Read functions
                </q-btn>
                <q-btn
                    no-caps
                    :outline="displayWriteFunctions === true"
                    @click="displayWriteFunctions = true"
                >
                    Write functions
                </q-btn>
            </q-btn-group>

            <q-list v-if="displayWriteFunctions" class="interface-list">
                <q-expansion-item
                    v-for="func in functions.write"
                    :key="func.name"
                    :label="func.name"
                    class="interface-item"
                >
                    <FunctionInterface
                        :abi="func"
                        :contract="contract"
                        :write="true"
                        group="write"
                        run-label="Write"
                        class="interface-input"
                    />
                </q-expansion-item>
            </q-list>
            <q-list v-else class="interface-list">
                <q-expansion-item
                    v-for="func in functions.read"
                    :key="func.name"
                    :label="func.name"
                    class="interface-item"
                >
                    <FunctionInterface
                        :abi="func"
                        :contract="contract"
                        :write="false"
                        group="read"
                        run-label="Query"
                        class="interface-input"
                    />
                </q-expansion-item>
            </q-list>
        </div>
    </div>
</div>
</template>

<script>
import JsonViewer from 'vue-json-viewer';

import Contract from 'src/lib/Contract';
import erc721Abi from 'src/lib/erc721';
import erc20Abi from "erc-20-abi";

import { sortFunctionsByName } from "src/lib/utils";

import FunctionInterface from 'components/ContractTab/FunctionInterface.vue';

/*
eztodo remove these comments, use as test data for PR
{
    "test": 15
}

erc721 abi JSON modded

[{"inppppputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"uint256","name":"_maxTokens","type":"uint256"},{"internalType":"address","name":"_linkToken","type":"address"},{"internalType":"address","name":"_chainlinkCoordinator","type":"address"},{"internalType":"uint256","name":"_chainlinkFee","type":"uint256"},{"internalType":"bytes32","name":"_chainlinkHash","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"baseURI","type":"string"}],"name":"SetBaseURI","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"chainlinkFee","type":"uint256"},{"indexed":false,"internalType":"bytes32","name":"chainlinkHash","type":"bytes32"}],"name":"SetChainlinkConfig","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"defaultURI","type":"string"}],"name":"SetDefaultURI","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"}],"name":"SetMinter","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"seed","type":"uint256"},{"indexed":false,"internalType":"bytes32","name":"requestId","type":"bytes32"}],"name":"SetRandomSeed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceUhhhhf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"baseURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"chainlinkFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"chainlinkHash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"defaultURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"finalBaseURI","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxTokens","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"metadataOf","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_count","type":"uint256"}],"name":"minttttmMMMMultiple","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"minter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"requestId","type":"bytes32"},{"internalType":"uint256","name":"randomness","type":"uint256"}],"name":"rawFulfillRandomness","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"seed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"seedReveal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"baseURI_","type":"string"},{"internalType":"bool","name":"finalBaseUri_","type":"bool"}],"name":"setBaseURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_chainlinkFee","type":"uint256"},{"internalType":"bytes32","name":"_chainlinkHash","type":"bytes32"}],"name":"setChainlinkConfig","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_defaultURI","type":"string"}],"name":"setDefaultURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_minter","type":"address"}],"name":"setMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]
*/

export default {
    name: 'GenericContractInterface',
    components: {
        FunctionInterface,
        JsonViewer,
    },
    data: () => ({
        address: null,
        contract: null,
        functions: null,
        displayWriteFunctions: false,
        customAbiDefinition: "",
        selectedAbi: null,
        abiOptions: {
            erc20: 'erc20',
            erc721: 'erc721',
            custom: 'custom',
        },
    }),
    computed: {
        showAbiFunctions() {
            return Object.values(this.abiOptions).includes(this.selectedAbi) &&
                ['read', 'write']
                    .some(access => (this.functions?.[access] ?? [])
                    .some(member => member.type === 'function'))
        },
        customAbiIsValidJSON() {
            try {
                return !!JSON.parse(this.customAbiDefinition);
            } catch {
                return false;
            }
        },
    },
    created() {
        this.address = this.$route.params.address;
    },
    async mounted() {
        await this.formatAbiFunctionLists();
    },
    methods: {
        async formatAbiFunctionLists() {
            const { custom, erc20, erc721 } = this.abiOptions;

            let abi;
            const customAbiSelected = this.selectedAbi === custom;

            const selectedAbiIsCustomAndValid =
                !!this.customAbiDefinition &&
                this.customAbiIsValidJSON &&
                customAbiSelected;

            // debugger;

            if (selectedAbiIsCustomAndValid) {
                abi = JSON.parse(this.customAbiDefinition);
            } else if (this.selectedAbi === erc20) {
                abi = erc20Abi;
            } else if (this.selectedAbi === erc721) {
                abi = erc721Abi;
            }

            // eztodo what to do if no abi?

            // debugger;


            this.contract = new Contract({
                name: 'Unverified contract',
                address: this.address,
                // creationInfo, // what is this?
                abi,
                manager: this.$contractManager,
                // token
            });

            let read = [];
            let write = [];

            //  eztodo pull out into util, share w/ contractinterface.vue
            (this.contract?.abi ?? []).forEach(a => {
                if(a.type !== 'function') return;

                if(a.stateMutability === 'view') {
                    read.push(a);
                } else {
                    write.push(a);
                }
            });

            this.functions = {
                read: sortFunctionsByName(read),
                write: sortFunctionsByName(write)
            };
        },
    },
    watch: {
        selectedAbi(oldValue, newValue) {
            if (oldValue !== newValue) {
                this.formatAbiFunctionLists();
                this.displayWriteFunctions = false;
            }
        },
        customAbiDefinition(oldValue, newValue) {
            if (oldValue !== newValue && this.customAbiIsValidJSON) {
                this.formatAbiFunctionLists();
                this.displayWriteFunctions = false;
            }
        }
    }
}
</script>
