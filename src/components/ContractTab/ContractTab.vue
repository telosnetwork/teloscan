<script>
import ContractSource from "components/ContractTab/ContractSource";
import ContractInterface from "components/ContractTab/ContractInterface";

export default {
  name: "ContractTab",
  components: { ContractSource, ContractInterface },
  data() {
    return {
      source: true,
      write: false
    }
  }
}
</script>

<template lang="pug">
  div.contract-tab
    q-btn-group( push )
      q-btn( push label="Code" @click="source=true")
      q-btn( push label="Read" @click="source=false; write=false")
      q-btn( push label="Write" @click="source=false; write=true")
    ContractSource( v-if="source" )
    ContractInterface( v-else :write='write' )
</template>

<style lang='sass'>
.contract-tab
  margin-left: 2rem
  margin-right: 2rem
</style>