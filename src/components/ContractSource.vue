<template lang='pug'>
.contract-source
  p.file-label Metadata:
  JsonViewer.source-container( 
    v-for='(item, key, index) in json'
    :value='item.content'
    :key='key'
    copyable
    expanded
    :expand-depth=1
    theme="custom-theme"
  )
  p.file-label Contracts:
  pre.source-container( v-for='(item, key, index) in contracts'  v-html='item.content')
</template>

<script lang="javascript">
import axios from 'axios';
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
        contracts: [],
        json: [],
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
    let sources;
    try{
      sources = 
        (await axios.get(`https://${process.env.VERIFIED_CONTRACTS_BUCKET}.s3.amazonaws.com/${this.$route.params.address}/source.json`)).data;
    }catch(e){
      console.log(e);
    }
    this.sortFiles(sources);
  },
  methods: {
    sortFiles(files){
      for (let file of files){
        if (this.isContract(file.name)){
          file.content = 
            hljs.highlight(file.content, { language: 'solidity' }).value;
          this.contracts.push(file);
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
    }
  }
}
</script>
<style lang='sass'>
.contract-source
  margin: 2rem
.source-container
  max-height: 20rem
  overflow-y: auto
  margin-bottom:2rem
</style>