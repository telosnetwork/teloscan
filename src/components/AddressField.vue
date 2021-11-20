<template lang="pug">
  a(:href="`/address/${this.address}`") {{ getDisplay() }}
</template>

<script>
// TODO: add copy icon and use this...
import { copyToClipboard } from 'quasar'
import { mapActions } from "vuex";

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
  data() {
    return {
      contract: null
    }
  },
  mounted() {
    this.loadContract();
  },
  methods: {
    ...mapActions("evm", ["getContract"]),
    goToAddress() {
      this.$router.push(`/address/${this.address}`);
    },
    getDisplay() {
      if (this.contract) {
        return this.contract.name;
      }

      return this.truncate > 0 ? `${this.address.slice(0, this.truncate)}...` : this.address;
    },
    async loadContract() {
      let contract = await this.getContract({address: this.address});
      if (contract) {
        this.contract = contract;
      }
    }

  }
}
</script>

<style scoped>

</style>
