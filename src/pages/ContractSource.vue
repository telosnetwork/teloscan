<template lang='pug'>
.pageContainer.row.q-pt-xl.tableWrapper
  .text-h4.text-primary.q-mb-lg Source Code
  .col-12.q-py-lg
    .ContentContainer
      q-tabs.ContentContainer.text-white(
        v-model="tab"
        dense
        active-color="secondary"
        align="justify"
        narrow-indicator
      )
        q-route-tab.topRounded(
          name="contract"
          :to="{ hash: '' }"
          exact
          replace
          label="Contract"
        )
        q-route-tab.topRounded(
          name="metadata"
          :to="{ hash: '' }"
          exact
          replace
          label="Metadata"
        )
        q-route-tab.topRounded(
          name="abi"
          :to="{ hash: '' }"
          exact
          replace
          label="ABI"
        )

      q-tab-panels.column.ContentContainer.shadow-2(
        v-model="tab"
        animated
        keep-alive
      )
        q-tab-panel(name="contract")
          pre( v-html='contract')
        q-tab-panel(name="metadata")
          JsonViewer(
            :value="metadata"
            copyable
            expanded
            :expand-depth=5
            theme="custom-theme"
          ) 
        q-tab-panel(name="abi")
          JsonViewer( 
            :value='abi'
            copyable
            expanded
            :expand-depth=5
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
        tab: "contract",
        contract: '',
        metadata: '',
        abi:''
    };
  },
  async mounted() {
    const response = await this.$telosApi.get(`contracts/source?contractAddress=${this.$route.params.address}`);
    debugger;
    this.contract = hljs.highlight(response.data.contract, { language: 'solidity'}).value; 
    this.abi = response.data.abi;
    this.metadata = JSON.parse(response.data.metadata);
    debugger;
  },
  computed: {
  },
  methods: {
  }
}
</script>

<style scoped lang="scss"></style>
