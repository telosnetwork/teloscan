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
        q-tab-panel(name="metadata")
        q-tab-panel(name="abi")
</template>

<script>

export default {
  name: "ContractSource",
  data() {
    return {
        tab: "contract",
    };
  },
  async mounted() {
    //  this.$telosApi.getSourceFiles(this.$route.params.address); 
  },
  computed: {
  },
  methods: {
  }
}
</script>

<style scoped lang="sass">

</style>
