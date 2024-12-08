<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import 'vue-json-pretty/lib/styles.css';
import ContractFactory from 'src/lib/contract/ContractFactory';
import { contractManager } from 'src/boot/telosApi';
import { erc721Abi, erc1155Abi } from 'src/lib/abi';
import erc20Abi from 'erc-20-abi';
import { sortAbiFunctionsByName } from 'src/lib/utils';

import VueJsonPretty from 'vue-json-pretty';
import FunctionInterface from 'components/ContractTab/FunctionInterface.vue';
import AppHeaderWallet from 'src/components/header/AppHeaderWallet.vue';

const $q = useQuasar();
const route = useRoute();
const { t: $t } = useI18n();
const factory = new ContractFactory();

const props = defineProps({
    contract: Object,
});

const fileModel = ref<any>(null);
const address = ref('');
const functions = ref({ read: [], write: [] });
const displayWriteFunctions = ref(false);
const customAbiDefinition = ref('');
const selectedAbi = ref<any>(null);
const abiOptions = {
    erc20: 'erc20',
    erc721: 'erc721',
    erc1155: 'erc1155',
    custom: 'custom',
};
const selectedContract = ref<any>(null);

address.value = route.params.address as string;

const showAbiFunctions = computed(() => Object.values(abiOptions).includes(selectedAbi.value) &&
    ['read', 'write'].some(access => (functions.value[access] ?? []).some(member => member.type === 'function')),
);

const customAbiIsValidJSON = computed(() => {
    try {
        JSON.parse(customAbiDefinition.value);
        return true;
    } catch {
        return false;
    }
});

const autoloadedAbi = computed(() => props.contract?.autoloadedAbi);

watch(selectedAbi, (newValue, oldValue) => {
    if (oldValue !== newValue) {
        formatAbiFunctionLists();
        displayWriteFunctions.value = false;
    }
});

watch(customAbiDefinition, (newValue, oldValue) => {
    if (oldValue !== newValue && customAbiIsValidJSON.value) {
        formatAbiFunctionLists();
        displayWriteFunctions.value = false;
    }
    // if we detect any change in the custom abi definition, we should reset the fileModel
    if (oldValue && oldValue !== newValue) {
        fileModel.value = null;
    }
    // if newValue is empty, we should reset
    if (!newValue) {
        reset();
    }
});

const uploadFile = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            const json = event.target?.result;
            try {
                JSON.parse(json as string);
                customAbiDefinition.value = json as string;
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                reset();
                $q.notify({
                    message: 'Invalid JSON file',
                    color: 'negative',
                });
            }
        };
        fileReader.onerror = (event: any) => {
            console.error('Error reading file:', event.target.error);
            $q.notify({
                message: 'Error reading file',
                color: 'negative',
            });
        };
        fileReader.readAsText(file);
    }
};

const reset = () => {
    functions.value = { read: [], write: [] };
    fileModel.value = null;
    customAbiDefinition.value = '';
};

const formatAbiFunctionLists = async () => {
    functions.value = {
        read: [],
        write: [],
    };

    const { custom, erc20, erc721, erc1155 } = abiOptions;

    let abi;
    const customAbiSelected = selectedAbi.value === custom;

    const selectedAbiIsCustomAndValid =
                    !!customAbiDefinition.value &&
                    customAbiIsValidJSON.value &&
                    customAbiSelected;
    if (selectedAbiIsCustomAndValid) {
        abi = JSON.parse(customAbiDefinition.value);
    } else if (selectedAbi.value === erc20) {
        abi = erc20Abi;
    } else if (selectedAbi.value === erc721) {
        abi = erc721Abi;
    } else if (selectedAbi.value === erc1155) {
        abi = erc1155Abi;
    } else {
        return;
    }
    if (!Array.isArray(abi)) {
        if (abi.abi && Array.isArray(abi.abi)) {
            abi = abi.abi;
        }
    }

    selectedContract.value = factory.buildContract({
        name: $t('components.contract_tab.unverified_contract'),
        address: address.value,
        abi,
        manager: contractManager,
    });
    let read = [] as any[];
    let write = [] as any[];

    (selectedContract.value?.abi ?? []).forEach((a) => {
        if (a.type !== 'function') {
            return;
        }

        if (a.stateMutability === 'view') {
            read.push(a);
        } else {
            write.push(a);
        }
    });
    functions.value = {
        read: sortAbiFunctionsByName(read),
        write: sortAbiFunctionsByName(write),
    };
};

</script>

<template>
<q-card class="c-gcontract-interface">
    <div class="c-gcontract-interface__container">
        <div class="c-gcontract-interface__header">
            <p class="c-gcontract-interface__header-paragraph">
                <q-icon
                    name="warning"
                    class="text-warning q-mt-xs q-mr-xs"
                    size="1.5rem"
                />
                <span><b>{{ $t('components.contract_tab.unverified_contract_source') }}</b></span>
            </p>
            <p class="c-gcontract-interface__header-paragraph">
                <span>
                    {{ $t('components.contract_tab.verified_contract_source') }}
                    <a href="https://sourcify.dev/" target="_blank">
                        {{ $t('components.contract_tab.here') }}
                    </a>
                </span>
            </p>
            <p v-if="autoloadedAbi" class="c-gcontract-interface__header-paragraph">
                {{ $t('components.contract_tab.abi_autoloaded') }}
            </p>
            <p v-else class="c-gcontract-interface__header-paragraph">
                {{ $t('components.contract_tab.choose_abi') }}
            </p>
        </div>

        <div class="row q-pb-lg">
            <div class="col-12">
                <div class="c-gcontract-interface__tab-container">
                    <q-btn
                        :label="$t('components.contract_tab.use_erc20_abi')"
                        :class="{
                            'c-gcontract-interface__tab': true,
                            'c-gcontract-interface__tab--active': selectedAbi === abiOptions.erc20,
                        }"
                        @click="selectedAbi = abiOptions.erc20"
                    />
                    <q-btn
                        :label="$t('components.contract_tab.use_erc721_abi')"
                        :class="{
                            'c-gcontract-interface__tab': true,
                            'c-gcontract-interface__tab--active': selectedAbi === abiOptions.erc721,
                        }"
                        @click="selectedAbi = abiOptions.erc721"
                    />
                    <q-btn
                        :label="$t('components.contract_tab.use_erc1155_abi')"
                        :class="{
                            'c-gcontract-interface__tab': true,
                            'c-gcontract-interface__tab--active': selectedAbi === abiOptions.erc1155,
                        }"
                        @click="selectedAbi = abiOptions.erc1155"
                    />
                    <q-btn
                        :label="$t('components.contract_tab.abi_from_json')"
                        :class="{
                            'c-gcontract-interface__tab': true,
                            'c-gcontract-interface__tab--active': selectedAbi === abiOptions.custom,
                        }"
                        @click="selectedAbi = abiOptions.custom"
                    />
                </div>
            </div>
        </div>

        <div v-if="selectedAbi === abiOptions.custom" class="row q-mb-lg">
            <div v-if="!customAbiIsValidJSON" class="col-12">
                <div class="row">
                    <div class="col-12 col-sm-8 col-lg-9">
                        <q-input
                            v-model="customAbiDefinition"
                            clearable
                            name="custom-abi"
                            :label="$t('components.contract_tab.paste_abi_json_here')"
                            class="q-pb-lg"
                            autocomplete="off"
                            type="text"
                        />
                    </div>
                    <div class="col-12 col-sm-4 col-lg-3">
                        <q-file
                            v-model="fileModel"
                            outlined
                            name="custom-abi-file"
                            :label="$t('components.contract_tab.upload_abi_json')"
                            class="abi-json-uploader q-ml-md text-center"
                            accept=".json"
                            @input="uploadFile"
                        />
                    </div>
                </div>
            </div>
            <div v-if="customAbiIsValidJSON" class="col-12">
                <q-expansion-item
                    class="shadow-2 q-mb-md"
                >
                    <template v-slot:header>
                        <div class="c-gcontract-interface__abi_expansion_head">
                            <span>{{ $t('components.contract_tab.abi_json_preview') }}</span>
                            <q-icon
                                name="close"
                                size="sm"
                                class="clickable"
                                @click.stop="reset"
                            >
                                <q-tooltip>{{ $t('components.contract_tab.discard_abi_json') }}</q-tooltip>
                            </q-icon>
                        </div>
                    </template>

                    <q-card>
                        <div class="q-pa-md">
                            <VueJsonPretty
                                :data="JSON.parse(customAbiDefinition)"
                                :depth="1"
                                expanded
                            />
                        </div>
                    </q-card>
                </q-expansion-item>
            </div>
            <div class="col-sm-12">
                <template v-if="!!customAbiDefinition">
                    <p
                        v-if="!customAbiIsValidJSON"
                        class="text-negative"
                    >
                        {{ $t('components.contract_tab.provided_json_invalid') }}
                    </p>
                </template>
            </div>
        </div>

        <div v-if="showAbiFunctions" class="row">
            <div class="col-12">
                <div class="c-gcontract-interface__tab-container">
                    <q-btn
                        :label="$t('components.contract_tab.read')"
                        :class="{
                            'c-gcontract-interface__tab': true,
                            'c-gcontract-interface__tab--active': !displayWriteFunctions,
                        }"
                        @click="displayWriteFunctions = false"
                    />
                    <q-btn
                        :label="$t('components.contract_tab.write')"
                        :class="{
                            'c-gcontract-interface__tab': true,
                            'c-gcontract-interface__tab--active': displayWriteFunctions,
                        }"
                        @click="displayWriteFunctions = true"
                    />
                </div>
                <AppHeaderWallet v-if="displayWriteFunctions" class="c-login-button"/>
                <q-list>
                    <q-expansion-item
                        v-for="func in (displayWriteFunctions ? functions.write : functions.read)"
                        :key="(func as any).name"
                        :label="(func as any).name"
                        class="shadow-2 q-mb-md"
                    >
                        <q-card>
                            <div class="q-pa-md">
                                <FunctionInterface
                                    :abi="func"
                                    :contract="selectedContract"
                                    :write="displayWriteFunctions"
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
</q-card>
</template>
<style lang="scss">
.c-gcontract-interface {
    &__container {
        padding: 1rem;
    }

    &__header {
        display: flex;
        flex-direction: column;
        &-paragraph {
            display: flex;
            gap: 5px;
            align-items: flex-end;
        }
    }

    &__tab-container{
        display: inline-flex;
        gap: .5rem;
        margin-bottom: 0.5rem;
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

    &__abi_expansion_head {
        padding: 0.5rem 1rem;
        cursor: pointer;

        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
}
.abi-json-uploader .q-field__label {
    text-align: center;
    width: 100%;
}
.c-login-button {
    margin-bottom: 0.5rem;
    margin-left: 0.5rem;
}
</style>
