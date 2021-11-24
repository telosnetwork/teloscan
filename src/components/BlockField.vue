<template lang="pug">
  router-link(:to="`/block/${this.block}`") {{ block }}
</template>

<script>
export default {
  name: "BlockField",
  props: {
    block: {
      type: Number,
      required: true
    }
  },
}
</script>

<style scoped>

</style>
