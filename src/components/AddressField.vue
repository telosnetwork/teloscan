<script>
import { mapActions } from 'vuex';
import { ethers } from 'ethers';

import CopyButton from 'components/CopyButton';

export default {
    name: 'AddressField',
    components: {
        CopyButton,
    },
    props: {
        address: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            default: '',
        },
        copy: {
            type: Boolean,
            default: false,
        },
        highlight: {
            type: Boolean,
            default: false,
        },
        truncate: {
            type: Number,
            default: 18,
        },
        isContractTrx: {
            type: Boolean,
            default: false,
        },
    },
    data: () => ({
        contract: null,
    }),
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
            if(!this.address){
                return;
            }
            if (this.name) {
                return this.truncate > 0 && this.name.length > this.truncate ?
                    `${this.name.slice(0, this.truncate)}...` :
                    `${this.name}`;
            }

            if (this.contract && this.contract.getName()) {
                const name = this.contract.getName();
                if(name[0] === '0' && name[1] === 'x'){
                    return this.truncate > 0 ? `${this.address.slice(0, this.truncate)}...` : this.address;
                }
                return this.truncate > 0 && name.length > this.truncate ?
                    `${name.slice(0, this.truncate)}...` :
                    `${name}`;
            }
            if (!this.address) {
                return '';
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
            let contract = await this.getContract({ address: this.address });
            if (contract) {
                this.contract = contract;
            }
        },

    },
};
</script>

<template>
<div class="c-address-field">
    <q-icon v-if="contract && !copy" class="far fa-file-alt">
        <q-tooltip>Contract</q-tooltip>
    </q-icon>
    <router-link :to="`/address/${address}`" :class="highlight ? 'highlighted' : ''">
        {{ getDisplay() }}
    </router-link>
    <CopyButton v-if="copy && address" :text="address" description="address"/>
</div>
</template>

<style lang="scss" scoped>
.c-address-field {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
a.highlighted {
    color: #bb9200;
}
body.body--dark a.highlighted {
    color: $warning;
}
</style>
