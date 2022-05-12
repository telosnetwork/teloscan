<script>
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

<template lang="pug">
  router-link(:to="`/tx/${this.transactionHash}`") {{ transactionHash.slice(0,20) }}...
  //- eztodo add copy button here
</template>
