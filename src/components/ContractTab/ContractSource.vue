<script lang="javascript">
import axios from 'axios';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import hljs from 'highlight.js/lib/core';
import hljsDefineSolidity from 'highlightjs-solidity';
import 'highlight.js/styles/default.css';
import json from 'highlight.js/lib/languages/json';
import { toChecksumAddress } from 'src/lib/utils';
import CopyButton from 'src/components/CopyButton';

hljs.registerLanguage('json', json);
hljsDefineSolidity(hljs);

export default {
    name: 'ContractSource',
    components: {
        VueJsonPretty,
        CopyButton,
    },
    data() {
        return {
            tab:'sources',
            contracts: [],
            json: [],
            loading: true,
            sources: false,
        };
    },
    async mounted() {
        let sources;
        try{
            const checkSumAddress = toChecksumAddress(this.$route.params.address);
            sources = await axios.get(
                `https://${process.env.VERIFIED_CONTRACTS_BUCKET}.s3.amazonaws.com/${checkSumAddress}/source.json`,
            );
        }catch(e){
            console.log(e);
        }
        if(sources){
            this.sources = sources;
            this.sortFiles(sources.data.files);
        }
        this.loading = false;
    },
    methods: {
        arrowIcon(file) {
            return file.expanded ? 'arrow_drop_down' : 'arrow_right';
        },
        sortFiles(files){
            for (let file of files){
                file.expanded = true;
                if (this.isContract(file.name)){
                    file.raw = file.content;
                    file.content =
            hljs.highlight(file.content, { language: 'solidity' }).value;
                    this.contracts.unshift(file);
                }else{
                    if (this.isJson(file.name)){
                        file.content = JSON.parse(file.content);
                    }
                    this.json.push(file);
                }
            }
        },
        isContract(fileName){
            let ext = fileName.split('.').pop();
            return ext === 'sol';
        },
        isJson(fileName){
            let ext = fileName.split('.').pop();
            return ext === 'json';
        },
    },
};
</script>

<template>
<div class="contract-source">
    <div v-if="loading"><q-spinner size="md" /></div>
    <div v-else-if="!sources" class="q-pt-md q-pb-xl">
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
    </div>
    <div v-else>
        <div v-for="(item, index) in json" :key="`viewer-${index}`">
            <p class="file-label flex justify-between">
                <span class="flex items-center clickable"  @click="item.expanded = !item.expanded">
                    <q-icon :name="arrowIcon(item)" size="sm"  /> {{ item.name }}
                </span>
                <span class="right"><CopyButton :text="JSON.stringify(item.content, null, 2)" /></span>
            </p>
            <VueJsonPretty
                v-if="item.expanded"
                class="source-container"
                :data="item.content"
                :showLine="false"
                :virtual="true"
            />
        </div>
        <div v-for="(item, index) in contracts" :key="`contract-${index}`">
            <p class="file-label flex justify-between">
                <span class="flex items-center clickable"  @click="item.expanded = !item.expanded">
                    <q-icon :name="arrowIcon(item)" size="sm"  /> {{ item.name }}
                </span>
                <span class="right"><CopyButton :text="item.raw" /></span>
            </p>
            <pre v-if="item.expanded" class="source-container q-pa-md" v-html="item.content"></pre>
        </div>
    </div>
</div>
</template>

<style lang='sass'>
.contract-source
  margin-top: 1rem

.source-container
  max-height: 20rem
  overflow-y: auto
  margin-bottom: 2rem
</style>
