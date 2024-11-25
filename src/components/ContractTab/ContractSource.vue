<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import axios from 'axios';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import hljsDefineSolidity from 'highlightjs-solidity';
import 'highlight.js/styles/default.css';
import { toChecksumAddress } from 'src/lib/utils';
import { useRoute } from 'vue-router';

import CopyButton from 'src/components/CopyButton.vue';
import ContractHeader from 'components/ContractHeader.vue';
import { MetaData } from 'src/types/MetaData';
import { useChainStore } from 'src/core';

hljs.registerLanguage('json', json);
hljsDefineSolidity(hljs);

const props = defineProps({
    contract: {
        type: Object,
        required: true,
    },
});

const route = useRoute();
const files = ref<any[] | {bytecode: any}>([]);
const fullscreen = ref(false);
const loading = ref(true);
const sources = ref(false);
const metaData = ref<MetaData>({});

// expand / collapse ------
interface ExpandedCollapsed {
    [key: string]: boolean;
}
const expanded = ref({} as ExpandedCollapsed);
const enableSave = ref(false);
const defaultState = ref<boolean | null>(null);

const saveDefaultState = () => {
    localStorage.setItem('expanded-default', JSON.stringify(defaultState.value));
};

const loadDefaultState = () => {
    const defaultStateData = localStorage.getItem('expanded-default');
    if (defaultStateData) {
        const parsed = JSON.parse(defaultStateData);
        defaultState.value = parsed;
        return true;
    } else {
        return false;
    }
};
loadDefaultState();

const expandAll = () => {
    for (const key in expanded.value) {
        expanded.value[key] = true;
    }
    defaultState.value = true;
    enableSave.value = true;
    saveDefaultState();
};

const collapseAll = () => {
    for (const key in expanded.value) {
        expanded.value[key] = false;
    }
    defaultState.value = false;
    enableSave.value = true;
    saveDefaultState();
};

// this function saves expanded content to local storage
const saveExpanded = () => {
    if (enableSave.value) {
        localStorage.setItem(`expanded-${props.contract.address}`, JSON.stringify(expanded.value));
    }
};

// this function loads expanded content from local storage
const loadExpanded = () => {
    const expandedData = localStorage.getItem(`expanded-${props.contract.address}`);
    if (expandedData) {
        const parsed = JSON.parse(expandedData);
        for (const key in parsed) {
            expanded.value[key] = parsed[key];
        }
        return true;
    } else {
        return false;
    }
};

const getFileKey = (index: number) => `viewer-${index}`;

watch(expanded.value, () => {
    saveExpanded();
});

onMounted(async () => {
    let sourceData;
    try {
        // TODO: remove this
        const checkSumAddress = toChecksumAddress(route.params.address);
        const response = await axios.get(
            `${useChainStore().currentChain.settings.getTrustedContractsBucket()}/${checkSumAddress}/source.json`,
        );
        sourceData = response.data;
        sources.value = sourceData;
        sortFiles(sourceData.files);
    } catch (e) {
        console.error(e);
    }

    if ((files.value as {bytecode: any}).bytecode) {
        loading.value = false;
    }

    loading.value = false;
});

const toggleFullscreen = (item: any) => {
    window.scrollTo(0, 0);
    fullscreen.value = !fullscreen.value;
    item.fullscreen = !item.fullscreen;
};

const sortFiles = (filesToSort: any[]) => {
    for (const file of filesToSort) {
        file.expanded = true;
        file.fullscreen = false;
        file.raw = file.content;

        if (isContract(file.name)) {
            file.contract = true;
            file.content = hljs.highlight(file.content, { language: 'solidity' }).value;
            (files.value as any[]).push(file);
        } else {
            if (isJson(file.name)) {
                file.content = JSON.parse(file.content);
                if (file.name === 'metadata.json'){
                    setMetaData(file.content);
                }
            }
            (files.value as any[]).unshift(file);
        }
    }

    const loaded = loadExpanded();
    if (!loaded) {
        (files.value as any[]).forEach((file, index) => {
            expanded.value[getFileKey(index)] = defaultState.value === null ? true : defaultState.value;
        });
    }
};

const isContract = (fileName: string) => {
    const ext = fileName.split('.').pop();
    return ext === 'sol';
};

const isJson = (fileName: string) => {
    const ext = fileName.split('.').pop();
    return ext === 'json';
};

const setMetaData = (data: any) => {
    metaData.value = {
        compiler: data.compiler.version,
        enabled: data.settings.optimizer.enabled,
        runs: data.settings.optimizer.runs,
    };
};

</script>

<template>
<ContractHeader :contract="contract" :metaData="metaData"/>
<div :class="(fullscreen) ? 'contract-source abs' : 'contract-source'">
    <div v-if="loading" class="q-pa-lg justify-center"><q-spinner size="md" /></div>
    <div v-else-if="!sources" class="q-pt-md q-pb-xl">
        <p class="flex">
            <q-icon
                name="warning"
                class="text-warning q-mt-xs q-mr-xs"
                size="1.5rem"
            />
            <span>{{ $t('components.contract_tab.unverified_contract_source') }}</span>
        </p>
        <p>
            <span>{{ $t('components.contract_tab.verified_contract_source') }}</span>
            <a href="https://sourcify.dev/" target="_blank">
                {{ $t('components.contract_tab.here') }}
            </a>
        </p>
        <p v-if="contract?.autoloadedAbi">
            {{ $t('components.contract_tab.abi_autoloaded') }}
        </p>
        <p v-else>
            {{ $t('components.contract_tab.choose_abi') }}
        </p>
    </div>
    <div v-else>
        <div class="flex justify-end q-mb-md">
            <q-icon
                name="expand_more"
                size="sm"
                class="clickable q-mr-md"
                @click="expandAll()"
            >
                <q-tooltip>{{ $t('components.expand_all') }}</q-tooltip>
            </q-icon>
            <q-icon
                name="expand_less"
                size="sm"
                class="clickable"
                @click="collapseAll()"
            >
                <q-tooltip>{{ $t('components.collapse_all') }}</q-tooltip>
            </q-icon>
        </div>

        <q-expansion-item
            v-for="(item, index) in files as any[]"
            :key="`viewer-${index}`"
            v-model="expanded[getFileKey(index)]"
            :default-opened="true"
            class="shadow-2 q-mb-md"
            @update:model-value="enableSave = true; expanded[getFileKey(index)] = $event;"
        >
            <template v-slot:header>
                <div class="flex items-center justify-between">
                    <span>{{ item.name }}</span>
                    <span
                        class="q-item__section flex q-item__section--side items-center cursor-pointer"
                    >
                        <span v-if="expanded[getFileKey(index)]">
                            <q-icon
                                name="fullscreen"
                                size="sm"
                                class="clickable"
                                @click.stop="toggleFullscreen(item)"
                            />
                            <q-tooltip>{{ $t('global.toggle_fullscreen') }}</q-tooltip>
                        </span>
                        <CopyButton :text="item.raw" />
                    </span>
                </div>
            </template>
            <q-card :class="(item.fullscreen) ? 'fullscreen' : ''">
                <q-card-section
                    v-if="!item.contract"
                    class="source-container"
                >
                    <VueJsonPretty
                        class="q-pa-md"
                        :data="item.content"
                        :showLine="false"
                    />
                </q-card-section>
                <q-card-section v-else class="source-container">
                    <pre
                        v-if="item.expanded || item.fullscreen"
                        class="q-pa-md"
                        v-html="item.content"
                    ></pre>
                </q-card-section>
                <q-card-section
                    v-if="item.fullscreen"
                    class="exit flex items-center justify-center"
                    @click="toggleFullscreen(item)"
                >
                    <q-icon name="close_fullscreen" size="xs" class="q-mr-xs" />
                    <span>{{ $t('global.close') }} </span>
                </q-card-section>
            </q-card>
        </q-expansion-item>
    </div>
</div>
</template>

<style lang="scss" scoped>
body.body--light .source-container {
    background-color: #f5f5f58f;
}
.contract-source .q-item__section--side {
    padding: 0;
}

.q-expansion-item{
    border-radius: 12px;
    .q-card{
        border-radius: 12px;
    }
    .q-item{
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
    }
    &--collapsed{
        .q-item{
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
        }
    }
    &--expanded{
        .q-item{
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
    }
}
.fullscreen {
    top: 110px;
}
.fullscreen pre {
    padding-bottom: 120px;
}
pre {
    margin-top: 0;
}
.body--dark .q-item__section--side:not(.q-item__section--avatar) {
    color: rgba(255, 255, 255, 0.7);
}
.contract-source {
    padding-bottom: 10px;
}
.contract-source.abs {
    height: 0px;
}
.contract-source .q-item {
    padding: 0px;
    margin-bottom: 10px;
}
.contract-source .c-copy-button {
    margin-top: 1px;
}
.body--dark .exit {
    background: $dark;
}
.exit {
    position: fixed;
    width: 100%;
    bottom: 0;
    left: 0;
    z-index: 111111;
    height: 50px;
    background: var(--q-primary);
    cursor: pointer;
    line-height: 50px;
}
.contract-source .q-expansion-item  .fullscreen .q-card__section{
    overflow-x: auto;
}
.fullscreen .source-container{
    max-height: none;
    height: 100%;
    padding-bottom: 80px !important;
}
.contract-source .q-expansion-item .q-item > .flex{
    width: 100%;
}
.contract-source .q-expansion-item .q-card__section{
    overflow-x: hidden;
}
.contract-source .q-expansion-item .q-item{
    width: 100%;
    display: flex;
    justify-content: space-between;
}
.contract-source .q-focus-helper{
    display: none;
}
.contract-source .q-card__section{
    padding: 0;
}

.source-container{
    height: auto;
    max-height: 20rem;
    overflow-y: auto;
    margin-bottom: 2rem;
}

@media screen and (max-width: 1440px){
    .fullscreen{
        top: 48px;
    }
}
</style>
