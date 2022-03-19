<template lang="pug">
  div()
    q-input( v-model="value" :label="label" )
      template( v-slot:prepend )
        q-icon( :name="typeIcon" )
</template>

<script>
export default {
  name: "FunctionParameter",
  props: {
    abiParam: null,
    position: null
  },
  data() {
    return {
      label: null,
      value: null,
      typeIcon: null
    }
  },
  mounted() {
    this.label = `${this.abiParam.name ? this.abiParam.name : `Param ${this.position}`} (${this.abiParam.type})`
  }
}
</script>

<style scoped>

</style>
