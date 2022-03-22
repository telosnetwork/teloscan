<script>
import ContractSource from "components/ContractTab/ContractSource";
import ContractInterface from "components/ContractTab/ContractInterface";

export default {
  name: "ContractTab",
  components: { ContractSource, ContractInterface },
  data() {
    return {
      "show": "source",
      "address": ""
    }
  }
}
</script>

<template lang="pug">
  div
    q-btn-group( push )
      q-btn( push label="Code" @click="show='source'")
      q-btn( push label="Read/Write" @click="show='interface'")
    contract-source( v-if="show === 'source'" )
    contract-interface( v-if="show === 'interface'" )
</template>