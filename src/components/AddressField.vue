<template lang="pug">
  a(:href="`/address/${this.address}`") {{ address.slice(0,16) }}...
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
