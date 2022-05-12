<script>
import JsonViewer from 'vue-json-viewer'
export default {
    name: 'InternalTxns',
    components: {
        JsonViewer
    },
    props: {
        itxs: {
            type: Array,
            required: true,
        },
        contract: {
            type: Object,
            required: true,
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
