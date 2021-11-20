<template lang="pug">
  a(:href="`/address/${this.address}`") {{ truncate > 0 ? `${address.slice(0,truncate)}...` : address }}
</template>

<script>
// TODO: add copy icon and use this...
import { copyToClipboard } from 'quasar'

export default {
  name: "AddressField",
  props: {
    address: {
      type: String,
      required: true
    },
    truncate: {
      type: Number,
      required: false,
      default: 20
    }
  },
  methods: {
    goToAddress() {
      this.$router.push(`/address/${this.address}`);
    }
  }
}
</script>

<style scoped>

</style>
