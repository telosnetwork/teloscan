<script>
import JsonViewer from 'vue-json-viewer'
import LogsTable from './LogsTable'

export default {
    name: 'LogsViewer',
    components: {
        JsonViewer, LogsTable,
    },
    props: {
        rawLogs: {
            type: Array,
            required: false,
            default(){
                return [];
            },
        },
        logs: {
            type: Array,
            required: true,
        },
    },
    data(){
        return {
            readable: true,
        }
    },
}
</script>

<template lang="pug">
  pre(v-if="logs.length == 0")
    h3.text-center
      q-icon(class="fa fa-info-circle" size="md" style="margin: -5px 20px 0px 5px;")
      span No logs found
  pre(v-else)
    .switch
      <q-toggle v-model="readable" icon="visibility" color="secondary" size="lg" /> Human friendly logs
    div(v-if="!readable")
      <json-viewer :value="rawLogs.length ? rawLogs : logs" theme="jsonViewer" />
      small(class="q-pa-md q-ml-sm rounded-borders bg-purple-grey")
        q-icon(class="fa fa-info-circle" style="margin: -3px 5px 0px 0px; font-size:10px;")
        span Click on the arrows to expand the JSON object, use ALT + click to expand or minimize all children
    div(v-else)
      <logs-table :logs="logs" />
</template>
