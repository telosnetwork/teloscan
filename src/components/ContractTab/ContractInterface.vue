<script lang="javascript">
import FunctionInterface from "components/ContractTab/FunctionInterface";

export default {
  name: "ContractInterface",
  components: { FunctionInterface },
  props: ['write'],
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
      read: this.sortByName(read),
      write: this.sortByName(write)
    }
  },
  methods: {
    sortByName(functions) {
      return functions.sort((a, b) => {
        const upperA = a.name.toUpperCase()
        const upperB = b.name.toUpperCase()
        return (upperA < upperB) ? -1 : (upperA > upperB) ? 1 : 0;
      })
    }
  }
}
</script>

<template lang='pug'>
  div
    q-list.interface-list(v-if='write')
      q-expansion-item.interface-item( v-for="func in functions.write" :label="func.name" :key="func.name" )
        FunctionInterface.interface-input( :abi="func" :contract="contract" group="write" )
    q-list.interface-list(v-else )
      q-expansion-item.interface-item( v-for="func in functions.read" :label="func.name" :key="func.name" )
        FunctionInterface.interface-input( :abi="func" :contract="contract" group="read" )
</template>

<style lang='sass'>
.interface-list
  margin-bottom: 1.5rem

.interface-item .q-item
  border: .125rem solid grey
  border-radius: .25rem .25rem 0 0
  margin-top: 1rem

.interface-input
  border-width: 0 .125rem .125rem .125rem 
  border-style: solid
  border-color: gray
  border-radius: 0 0 .25rem .25rem

</style>
