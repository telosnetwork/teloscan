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
  div
    q-btn-group( push )
      q-btn( push label="Code" @click="source=true")
      q-btn( push label="Read" @click="source=false; write=false")
      q-btn( push label="Write" @click="source=false; write=true")
    ContractSource( v-if="source" )
    ContractInterface( v-else :write='write' )
</template>