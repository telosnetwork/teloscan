<template lang="pug">
  router-link(:to="`/tx/${this.transactionHash}`") {{ transactionHash.slice(0,20) }}...
</template>

<script>
// TODO: add copy icon and use this...
import { copyToClipboard } from 'quasar'

export default {
  name: "TransactionField",
  props: {
    transactionHash: {
      type: String,
      required: true
    }
  },
  methods: {
    goToAddress() {
      this.$router.push(`/tx/${this.transactionHash}`);
    }
  }
}
</script>

<style scoped>

</style>
