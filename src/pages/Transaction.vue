<template lang="pug">
  .q-px-xl
    div()
      h4() Transaction Hash: {{hash}}
</template>

<script>
export default {
  name: "Transaction",
  components: { },
  data() {
    return {
      hash: this.$route.params.hash
    }
  }

}
</script>

<style scoped>

</style>
