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
            .code-container {{ this.contract }}
        q-tab-panel(name="metadata")
            .code-container {{ this.metadata }}
        q-tab-panel(name="abi")
            .code-container {{ this.abi }}
</template>

<script>

export default {
  name: "ContractSource",
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
    [this.contract, this.abi, this.metadata] = response.data;
  },
  computed: {
  },
  methods: {
  }
}
</script>

<style scoped lang="sass">

</style>
