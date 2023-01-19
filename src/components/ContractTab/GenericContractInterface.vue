<script>
import JsonViewer from 'vue-json-viewer';

import Contract from 'src/lib/Contract';
import { erc721Abi } from 'src/lib/abi';
import erc20Abi from 'erc-20-abi';

import { sortAbiFunctionsByName } from 'src/lib/utils';

import FunctionInterface from 'components/ContractTab/FunctionInterface.vue';

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
        customAbiDefinition: '',
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
                        .some(member => member.type === 'function'));
        },
        customAbiIsValidJSON() {
            try {
                return !!JSON.parse(this.customAbiDefinition);
            } catch {
                return false;
            }
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
        },
    },
    created() {
        this.address = this.$route.params.address;
    },
    methods: {
        async formatAbiFunctionLists() {
            this.functions = {
                read: [],
                write: [],
            };

            const { custom, erc20, erc721 } = this.abiOptions;

            let abi;
            const customAbiSelected = this.selectedAbi === custom;

            const selectedAbiIsCustomAndValid =
                !!this.customAbiDefinition &&
                this.customAbiIsValidJSON &&
                customAbiSelected;

            if (selectedAbiIsCustomAndValid) {
                abi = JSON.parse(this.customAbiDefinition);
            } else if (this.selectedAbi === erc20) {
                abi = erc20Abi;
            } else if (this.selectedAbi === erc721) {
                abi = erc721Abi;
            } else {
                return;
            }

            this.contract = new Contract({
                name: this.$t('components.contract_tab.unverified_contract'),
                address: this.address,
                abi,
                manager: this.$contractManager,
            });

            let read = [];
            let write = [];

            (this.contract?.abi ?? []).forEach((a) => {
                if (a.type !== 'function') {
                    return;
                }

                if (a.stateMutability === 'view') {
                    read.push(a);
                } else {
                    write.push(a);
                }
            });

            this.functions = {
                read: sortAbiFunctionsByName(read),
                write: sortAbiFunctionsByName(write),
            };
        },
    },
};
</script>

<template>
<div class="q-pa-md">
    <div class="row q-pb-md">
        <div class="col-12">
            <p>
                <q-icon
                    name="warning"
                    class="text-negative"
                    size="1.25rem"
                />
                {{ $t('components.contract_tab.unverified_contract_source') }}
            </p>
            <p>
                <router-link :to="{ name: 'sourcify' }" :key="$route.path">
                    {{ $t('components.contract_tab.click_here') }}
                </router-link>
                {{ $t('components.contract_tab.upload_source_files') }}
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
                    {{ $t('components.contract_tab.use_erc20_abi') }}
                </q-btn>
                <q-btn
                    push
                    no-caps
                    :outline="selectedAbi === abiOptions.erc721"
                    @click="selectedAbi = abiOptions.erc721"
                >
                    {{ $t('components.contract_tab.use_erc721_abi') }}
                </q-btn>
                <q-btn
                    push
                    no-caps
                    :outline="selectedAbi === abiOptions.custom"
                    @click="selectedAbi = abiOptions.custom"
                >
                    {{ $t('components.contract_tab.abi_from_json') }}
                </q-btn>
            </q-btn-group>
        </div>
    </div>

    <div v-if="selectedAbi === abiOptions.custom" class="row q-mb-lg">
        <div class="col-sm-12 col-md-10 col-lg-8 col-xl-6">
            <q-input
                v-model="customAbiDefinition"
                clearable
                name="custom-abi"
                :label="$t('components.contract_tab.paste_abi_json_here')"
                class="q-pb-lg"
                autocomplete="off"
                type="text"
            />

            <template v-if="!!customAbiDefinition">
                <template v-if="customAbiIsValidJSON">
                    <p class="q-mb-sm">
                        {{ $t('components.contract_tab.abi_json_preview') }}
                    </p>
                    <JsonViewer
                        :value="JSON.parse(customAbiDefinition)"
                        :expand-depth="1"
                        expanded
                        theme="custom-theme"
                    />
                    <p
                        v-if="!showAbiFunctions"
                        class="text-negative"
                    >
                        {{ $t('components.contract_tab.provided_abi_invalid') }}
                    </p>
                </template>
                <p
                    v-else
                    class="text-negative"
                >
                    {{ $t('components.contract_tab.provided_json_invalid') }}
                </p>
            </template>
        </div>
    </div>

    <div v-if="showAbiFunctions" class="row">
        <div class="col-12">
            <q-btn-group class="q-mb-lg">
                <q-btn
                    no-caps
                    :outline="displayWriteFunctions === false"
                    @click="displayWriteFunctions = false"
                >
                    {{ $t('components.contract_tab.read_functions') }}
                </q-btn>
                <q-btn
                    no-caps
                    :outline="displayWriteFunctions === true"
                    @click="displayWriteFunctions = true"
                >
                    {{ $t('components.contract_tab.write_functions') }}
                </q-btn>
            </q-btn-group>

            <q-list>
                <q-expansion-item
                    v-for="func in (displayWriteFunctions ? functions.write : functions.read)"
                    :key="func.name"
                    :label="func.name"
                    class="shadow-2 q-mb-md"
                >
                    <q-card>
                        <div class="q-pa-md">
                            <function-interface
                                :abi="func"
                                :contract="contract"
                                :write="true"
                                :group="displayWriteFunctions ? 'write' : 'read'"
                                :run-label="displayWriteFunctions ? 'Write' : 'Query'"
                            />
                        </div>
                    </q-card>
                </q-expansion-item>
            </q-list>
        </div>
    </div>
</div>
</template>
