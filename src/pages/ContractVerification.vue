<template lang='pug'>
.pageContainer.row.q-pt-xl.tableWrapper
  .text-h4.text-primary.q-mb-lg Verify Contract
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
          name="options"
          :to="{ hash: '' }"
          exact
          replace
          label="Options"
        )
        q-route-tab.topRounded(
          name="results"
          :to="{ hash: '' }"
          exact
          replace
          label="Results"
        )
        q-route-tab.topRounded(
          name="details"
          :to="{ hash: '' }"
          exact
          replace
          label="details"
        )

      q-tab-panels.column.ContentContainer.shadow-2(
        v-model="tab"
        animated
        keep-alive
      )
        q-tab-panel(name="options")
          q-btn-dropdown(color="primary" label="Compiler Version")
              q-list
                  q-item(v-for="option in compilerOptions" :key='option' clickable v-close-popup @click="setCompiler(option)")
                      q-item-section()
                          q-item-label() {{option}}
</template>

<script>
import { getCompilerOptions } from 'src/lib/contractVerification';

export default {
  name: "ContractVerification",
  data() {
    return {
      tab: "general",
      compilerOptions: [],
      compilerVersion: ''
    };
  },
  async mounted() {
      this.compilerOptions = await getCompilerOptions();
  },
  methods: {
    setCompiler(option){
      this.compilerVersion = option;
    }
  }
}
</script>

<style scoped lang="scss">
span {
  word-wrap: break-word;
}
</style>
