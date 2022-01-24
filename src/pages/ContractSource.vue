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
          pre
            code {{ contract }}
        q-tab-panel(name="metadata")
          JsonViewer(
            :value="metadata"
            copyable
            theme="jsonViewer"
          ) 
        q-tab-panel(name="abi")
          JsonViewer(
            :value="abi"
            :expand-depth=4
            copyable
            theme="jsonViewer"
          ) 
</template>

<script>
import JsonViewer from 'vue-json-viewer';
import hljs from 'highlight.js/lib/core';
import hljsDefineSolidity from 'highlightjs-solidity';
import 'highlight.js/styles/default.css';

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
    this.contract = hljs.highlight(this.contract, { language: 'solidity'}).value; 
    this.abi = response.data.abi;
    this.metadata = response.data.metadata;
    debugger;
  },
  computed: {
  },
  methods: {
  }
}
</script>

<style scoped lang="sass">
.jv-container 
  max-height: 35rem
  overflow: auto
</style>
