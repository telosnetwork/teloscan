<script>
import JsonViewer from 'vue-json-viewer'
export default {
  name: 'InternalTxns',
  components: {
    JsonViewer
  },
  props: {
    itxs: {
      type: Array
    },
    contract: {
      type: Object
    }
  },
  data () {
    return {}
  }
}
</script>

<template lang="pug">
  pre
    //- div() {{ JSON.stringify(itxs, null, 4) }}
    <json-viewer :value="itxs" theme="jsonViewer"></json-viewer>
</template>