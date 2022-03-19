<template lang='pug'>
  div()
    q-list()
      q-expansion-item( v-if="functions" label="Read" :content-inset-level="1" )
        q-expansion-item( v-for="func in functions.read" :label="func.name" :key="func.name" )
          function-interface( :abi="func" :contract="contract" group="read" )
      q-expansion-item( v-if="functions" label="Write" :content-inset-level="1" )
        q-expansion-item( v-for="func in functions.write" :label="func.name" :key="func.name" )
          function-interface( :abi="func" :contract="contract" group="write" )

</template>

<script lang="javascript">
import FunctionInterface from "components/ContractTab/FunctionInterface";

export default {
  name: "ContractInterface",
  components: { FunctionInterface },
  data() {
    return {
      functions: null,
      contract: null
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

<style lang='sass'>

</style>
