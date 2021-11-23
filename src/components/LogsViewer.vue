<template lang="pug">
  pre()
    div() {{ JSON.stringify(logs, null, 4) }}
</template>

<script>
export default {
  name: "LogsViewer",
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
