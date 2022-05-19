<script lang="javascript">
import FunctionInterface from "components/ContractTab/FunctionInterface";

import { sortAbiFunctionsByName } from "src/lib/utils";

export default {
  name: "ContractInterface",
  components: { FunctionInterface },
  props: {
    write: {
      type: Boolean,
      required: true,
    }
  },
  data() {
    return {
      functions: [],
      contract: []
    };
  },
  async mounted() {
    this.contract = await this.$contractManager.getContract(this.$route.params.address);
    let read = [];
    let write = [];
    this.contract.abi.forEach(a => {
      if (a.type !== 'function')
        return;

      if (a.stateMutability === 'view') {
        read.push(a);
      } else {
        write.push(a);
      }
    })

    this.functions = {
      read: sortAbiFunctionsByName(read),
      write: sortAbiFunctionsByName(write)
    }
  }
}
</script>

<template lang='pug'>
  div
    q-list.interface-list(v-if='write')
      q-expansion-item.interface-item( v-for="func in functions.write" :label="func.name" :key="func.name" )
        FunctionInterface.interface-input( :abi="func" :contract="contract" group="write" runLabel='Write')
    q-list.interface-list(v-else )
      q-expansion-item.interface-item( v-for="func in functions.read" :label="func.name" :key="func.name" )
        FunctionInterface.interface-input( :abi="func" :contract="contract" group="read" runLabel='Query' )
</template>

<style lang='sass'>
.interface-list
  margin-bottom: 1.5rem

.interface-item.q-expansion-item
  border: .125rem solid grey
  border-radius: .25rem
  margin-top: 1rem
  font-size: .70rem
  &.q-expansion-item--expanded .q-item
    border-bottom: .125rem solid grey
    margin-bottom: 1rem

.interface-input .q-input
  border-width: .125rem
  border-style: solid
  border-color: gray
  border-radius: .25rem
  margin: 0 1rem 1rem 1rem
  padding-bottom: 1rem
  padding-right: 1rem
  padding-left: 1rem

</style>
