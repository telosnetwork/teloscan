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
    q-list(v-if='write')
      q-expansion-item( v-for="func in functions.write" :label="func.name" :key="func.name" )
        FunctionInterface( :abi="func" :contract="contract" group="write" )
    q-list(v-else )
      q-expansion-item( v-for="func in functions.read" :label="func.name" :key="func.name" )
        FunctionInterface( :abi="func" :contract="contract" group="read" )

</template>
