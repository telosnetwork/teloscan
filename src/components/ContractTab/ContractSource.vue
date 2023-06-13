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
            files: [],
            fullscreen: false,
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
        } catch(e){
            console.log(e);
        }
        if(sources){
            this.sources = sources;
            this.sortFiles(sources.data.files);
        }
        this.loading = false;
    },
    methods: {
        toggleFullscreen(item) {
            window.scrollTo(0, 0);
            this.fullscreen = !this.fullscreen;
            item.fullscreen = !item.fullscreen;
        },
        arrowIcon(file) {
            return file.expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
        },
        sortFiles(files){
            for (let file of files){
                file.expanded = true;
                file.fullscreen = false;
                if (this.isContract(file.name)){
                    file.contract = true;
                    file.raw = file.content;
                    file.content = hljs.highlight(file.content, { language: 'solidity' }).value;
                    this.files.push(file);
                }else{
                    if (this.isJson(file.name)){
                        file.content = JSON.parse(file.content);
                    }
                    this.files.unshift(file);
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
<div :class="(fullscreen) ? 'contract-source abs' : 'contract-source'">
    <div v-if="loading" class="q-pa-lg justify-center"><q-spinner size="md" /></div>
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
        <q-expansion-item
            v-for="(item, index) in files"
            :key="`viewer-${index}`"
            :modelValue="item.fullscreen"
            :default-opened="true"
            class="shadow-2 q-mb-md"
        >
            <template v-slot:header>
                <div class="flex items-center justify-between">
                    <span>{{ item.name }}</span>
                    <span class="q-item__section flex q-item__section--side items-center cursor-pointer">
                        <span>
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
<style lang='sass'>
.contract-source .q-item__section--side
        padding: 0
</style>
<style lang='sass' scoped>
.fullscreen
    top: 110px
.fullscreen pre
    padding-bottom: 120px
pre
    margin-top: 0
.body--dark .q-item__section--side:not(.q-item__section--avatar)
    color: rgba(255, 255, 255, 0.7)
.contract-source.abs
    height: 0px
.contract-source .q-item
  padding: 0px
  margin-bottom: 10px
.contract-source .c-copy-button
  margin-top: 0px
.contract-source
  margin-top: 1rem
.body--dark .exit
  background: $dark
.exit
    position: fixed
    width: 100%
    bottom: 0
    left: 0
    z-index: 111111
    height: 50px
    background: $primary
    cursor: pointer
    line-height: 50px
.contract-source .q-expansion-item  .fullscreen .q-card__section
    overflow-x: auto
.fullscreen .source-container
    max-height: none
    height: 100%
    padding-bottom: 80px !important
.contract-source .q-expansion-item .q-item > .flex
    width: 100%
.contract-source .q-expansion-item .q-card__section
    overflow-x: hidden
.contract-source .q-expansion-item .q-item
    width: 100%
    display: flex
    justify-content: space-between
.contract-source .q-focus-helper
    display: none
.contract-source .q-card__section
    padding: 0
.body.body--dark .q-card
    border-radius: 0
.source-container
  height: auto
  max-height: 20rem
  overflow-y: auto
  margin-bottom: 2rem
@media screen and (max-width: 1440px)
    .fullscreen
        top: 48px
</style>
