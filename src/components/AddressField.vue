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
    },
    isContractTrx: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      contract: null
    }
  },
  async mounted() {
    await this.loadContract();
  },
  methods: {
    ...mapActions("evm", ["getContract"]),
    goToAddress() {
      this.$router.push(`/address/${this.address}`);
    },
    getDisplay() {
      if (this.contract) {
        return `${this.contract.getName()}`;
      }

      return this.truncate > 0 ? `${this.address.slice(0, this.truncate)}...` : this.address;
    },
    async loadContract() {
      this.contract = null;
      if (!this.isContractTrx) {
        return;
      }

      // TODO: check if this is a contract, account lookup via telosevm-js?
      // TODO: if this is linked to a Telos account, display the Telos account name and link it to bloks
      //   for now if we ask for a contract, we'll get one back and it'll be labeled as undefined
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
