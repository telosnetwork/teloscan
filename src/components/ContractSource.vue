<template lang='pug'>
.contract-source
  .meta-data 
    .meta-field Name: 
      strong {{ metadata.name }}                
    .meta-field Compiler: 
      strong {{ metadata.compilerVersion }} 
    .meta-field Optimization: 
      strong {{ metadata.optimization.enabled }} 
      | with 
      strong {{ metadata.optimization.runs }} 
      | runs 
    .meta-field EVM version: 
      strong {{ metadata.evmVersion }}
  p Source Files:
  pre.source-container( v-for='(item, key, index) in sources'  v-html='item.content')
  p ABI: 
  JsonViewer.source-container( 
    :value='abi'
    copyable
    expanded
    :expand-depth=2
    theme="custom-theme"
  )
</template>

<script lang="javascript">
import JsonViewer from 'vue-json-viewer';
import hljs from 'highlight.js/lib/core';
import hljsDefineSolidity from 'highlightjs-solidity';
import 'highlight.js/styles/default.css';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('json', json);
hljsDefineSolidity(hljs);

export default {
  name: "ContractSource",
  components: {
    JsonViewer
  },
  data() {
    return {
        tab:"sources",
        sources: {},
        metadata: {
          optimization: {
            enabled: false,
            runs: 200
          },
          name: '',
          compilerVersion: ''
        },
        abi:{}
    };
  },
  async mounted() {
    const response = await this.$telosApi.get(`contracts/source?contractAddress=${this.$route.params.address}`);
    this.sources = response.data.sources;
    for (let key in this.sources){
      if (this.sources.hasOwnProperty(key)){
        this.sources[key].content = hljs.highlight(this.sources[key].content, { language: 'solidity' }).value;
      }
    }
    this.abi = response.data.abi;
    this.metadata = {
      name: Object.values(response.data.metadata.settings.compilationTarget)[0],
      compilerVersion : response.data.metadata.compiler.version,
      optimization: { enabled: response.data.metadata.settings.optimizer.enabled, runs: response.data.metadata.settings.optimizer.runs },
      evmVersion: response.data.metadata.settings.evmVersion
    }
  }
}
</script>
<style lang='sass'>
.contract-source
  margin: 2rem
.source-container
  max-height: 15rem
  overflow-y: auto
.meta-data
  margin-bottom: 2rem
.meta-field
  margin-right: 3rem
  display: inline-block
</style>