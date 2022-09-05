<script>
import { mapActions } from 'vuex';
import { ethers } from 'ethers';

export default {
    name: 'AddressField',
    props: {
        address: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            default: '',
        },
        truncate: {
            type: Number,
            required: false,
            default: 18,
        },
        isContractTrx: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            contract: null,
        }
    },
    watch: {
        address () {
            this.loadContract();
        },
    },
    async mounted() {
        await this.loadContract();
    },
    methods: {
        ...mapActions('evm', ['getContract']),
        getDisplay() {
            if (this.name) {
                return this.name;
            }

            if (this.contract) {
                return `${this.contract.getName()}`;
            }
            // This formats the address for us and handles zero padding we get from log events
            const address = ethers.utils.getAddress(this.address);
            return this.truncate > 0 ? `${address.slice(0, this.truncate)}...` : address;
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
        },

    },
}
</script>

<template lang="pug">
div.inline-div
    q-icon( v-if="this.contract" class="far fa-file-alt q-pr-xs contract-icon")
      q-tooltip Contract
    router-link( :to="`/address/${this.address}`") {{ getDisplay() }}
</template>

<style lang='sass' scoped>
.inline-div
  display: inline

.contract-icon
    padding-bottom: 6px
</style>
