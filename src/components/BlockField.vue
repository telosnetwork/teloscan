<template lang="pug">
  a(:href="`/block/${this.block}`") {{ block }}
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
