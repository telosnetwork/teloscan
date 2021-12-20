<template lang="pug">
  pre()
    //- div() {{ JSON.stringify(logs, null, 4) }}
    <json-viewer :value="logs" theme="jsonViewer" ></json-viewer>
</template>

<script>
import JsonViewer from 'vue-json-viewer'
export default {
  name: "LogsViewer",
  components: {
    JsonViewer
  },
  props: {
    logs: {
      type: Array
    },
    contract: {
      type: Object
    }
  },
  mounted() {

  }
}
</script>

<style scoped>

</style>
