<script>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import ContractFactory from 'src/lib/contract/ContractFactory';
import { erc721Abi, erc1155Abi } from 'src/lib/abi';
import erc20Abi from 'erc-20-abi';
import { sortAbiFunctionsByName } from 'src/lib/utils';
import FunctionInterface from 'components/ContractTab/FunctionInterface.vue';

export default {
    name: 'GenericContractInterface',
    components: {
        FunctionInterface,
        VueJsonPretty,
    },
    props: {
        contract: {
            type: Object,
        },
    },
    data: () => ({
        file_model: null,
        address: null,
        functions: null,
        displayWriteFunctions: false,
        customAbiDefinition: '',
        selectedAbi: null,
        abiOptions: {
            erc20: 'erc20',
            erc721: 'erc721',
            erc1155: 'erc1155',
            custom: 'custom',
        },
        factory: new ContractFactory(),
        selectedContract: null,
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
        selectedAbi(newValue, oldValue) {
            if (oldValue !== newValue) {
                this.formatAbiFunctionLists();
                this.displayWriteFunctions = false;
            }
        },
        customAbiDefinition(newValue, oldValue) {
            if (oldValue !== newValue && this.customAbiIsValidJSON) {
                this.formatAbiFunctionLists();
                this.displayWriteFunctions = false;
            }
            // if we detect any change in the custom abi definition, we should reset the file_model
            if (oldValue && oldValue !== newValue) {
                this.file_model = null;
            }
            // if newValue is empty, we should reset
            if (!newValue) {
                this.reset();
            }
        },
    },
    created() {
        this.address = this.$route.params.address;
    },
    methods: {
        reset() {
            this.functions = {
                read: [],
                write: [],
            };
            this.file_model = null;
            this.customAbiDefinition = '';
        },
        async uploadFile(e) {
            let file = e.target.files[0];
            let fileReader = new FileReader();
            fileReader.onload = (event) => {
                let json = event.target.result;
                try {
                    JSON.parse(json); // this will throw an error if the json is invalid
                    this.customAbiDefinition = json;
                } catch (error) {
                    console.error('Error parsing JSON file:', error);
                    this.reset();
                    this.$q.notify({
                        message: 'Invalid JSON file',
                        color: 'negative',
                    });
                }
            };
            fileReader.onerror = (event) => {
                console.error('Error reading file:', event.target.error);
                this.$q.notify({
                    message: 'Error reading file',
                    color: 'negative',
                });
            };
            fileReader.readAsText(file);
        },
        async formatAbiFunctionLists() {
            this.functions = {
                read: [],
                write: [],
            };

            const { custom, erc20, erc721, erc1155 } = this.abiOptions;

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
            } else if (this.selectedAbi === erc1155) {
                abi = erc1155Abi;
            } else {
                return;
            }
            if (!Array.isArray(abi)) {
                if (abi.abi && Array.isArray(abi.abi)) {
                    abi = abi.abi;
                }
            }

            this.selectedContract = this.factory.buildContract({
                name: this.$t('components.contract_tab.unverified_contract'),
                address: this.address,
                abi,
                manager: this.$contractManager,
            });
            let read = [];
            let write = [];

            (this.selectedContract?.abi ?? []).forEach((a) => {
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
            <p class="text-h5 flex">
                <q-icon
                    name="warning"
                    class="text-negative q-mt-xs q-mr-xs"
                    size="1.5rem"
                />
                <span>{{ $t('components.contract_tab.unverified_contract_source') }}</span>
            </p>
            <p>
                <a href="https://sourcify.dev/" target="_blank">
                    {{ $t('components.contract_tab.click_here') }}
                </a>
                {{ $t('components.contract_tab.upload_source_files') }}
            </p>
            <p v-if="this.contract?.autoloadedAbi">
                {{ $t('components.contract_tab.abi_autoloaded') }}
            </p>
            <p v-else>
                {{ $t('components.contract_tab.choose_abi') }}
            </p>
        </div>
    </div>

    <div class="row q-pb-lg">
        <div class="col-12">
            <div class="c-contract__tab-container">
                <q-btn
                    :label="$t('components.contract_tab.use_erc20_abi')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': selectedAbi === abiOptions.erc20,
                    }"
                    @click="selectedAbi = abiOptions.erc20"
                />
                <q-btn
                    :label="$t('components.contract_tab.use_erc721_abi')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': selectedAbi === abiOptions.erc721,
                    }"
                    @click="selectedAbi = abiOptions.erc721"
                />
                <q-btn
                    :label="$t('components.contract_tab.use_erc1155_abi')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': selectedAbi === abiOptions.erc1155,
                    }"
                    @click="selectedAbi = abiOptions.erc1155"
                />
                <q-btn
                    :label="$t('components.contract_tab.abi_from_json')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': selectedAbi === abiOptions.custom,
                    }"
                    @click="selectedAbi = abiOptions.custom"
                />
            </div>
        </div>
    </div>

    <div v-if="selectedAbi === abiOptions.custom" class="row q-mb-lg">
        <div class="col-12">
            <div class="row">
                <div class="col-12 col-sm-8 col-lg-9">
                    <q-input
                        v-model="customAbiDefinition"
                        clearable
                        name="custom-abi"
                        label="Paste ABI JSON here"
                        class="q-pb-lg"
                        autocomplete="off"
                        type="text"
                    />
                </div>
                <div class="col-12 col-sm-4 col-lg-3">
                    <q-file
                        v-model="file_model"
                        outlined
                        name="custom-abi-file"
                        label="upload ABI JSON file"
                        class="abi-json-uploader q-ml-md text-center"
                        accept=".json"
                        @input="uploadFile"
                    />
                </div>
            </div>
        </div>
        <div class="col-sm-12">
            <template v-if="!!customAbiDefinition">
                <template v-if="customAbiIsValidJSON">
                    <p class="q-mb-sm">
                        {{ $t('components.contract_tab.abi_json_preview') }}
                    </p>
                    <VueJsonPretty
                        :data="JSON.parse(customAbiDefinition)"
                        :depth="1"
                        expanded
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
            <div class="c-contract__tab-container">
                <q-btn
                    :label="$t('components.contract_tab.read')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': !displayWriteFunctions,
                    }"
                    @click="displayWriteFunctions = false"
                />
                <q-btn
                    :label="$t('components.contract_tab.write')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': displayWriteFunctions,
                    }"
                    @click="displayWriteFunctions = true"
                />
            </div>

            <q-list>
                <q-expansion-item
                    v-for="func in (displayWriteFunctions ? functions.write : functions.read)"
                    :key="func.name"
                    :label="func.name"
                    class="shadow-2 q-mb-md"
                >
                    <q-card>
                        <div class="q-pa-md">
                            <FunctionInterface
                                :abi="func"
                                :contract="selectedContract"
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
<style lang="scss">
.c-contract{
    margin-left: 2rem;
    margin-right: 2rem;
    padding-top: 1rem;

    &__tab-container{
        display: inline-flex;
        gap: .5rem;
    }

    &__tab{
        cursor: pointer;
        border-radius: 5px;
        color: var(--text-color);
        text-transform: capitalize !important;
        background-color: var(--tab-bg-color);

        &:hover{
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
.abi-json-uploader .q-field__label {
    text-align: center;
    width: 100%;
}
</style>
