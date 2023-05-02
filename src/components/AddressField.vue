<script>
import { ethers } from 'ethers';

import CopyButton from 'components/CopyButton';
import { getIcon } from 'src/lib/token-utils';

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
        logo: null,
        displayName: null,
    }),
    watch: {
        address () {
            this.loadContract();
        },
    },
    async mounted() {
        await this.loadContract();
        await this.getDisplay();
    },
    methods: {
        getIcon,
        async getDisplay() {
            if (this.name) {
                this.displayName = this.truncate > 0 && this.name.length > this.truncate ?
                    `${this.name.slice(0, this.truncate)}...` :
                    `${this.name}`;
                return;
            }
            if(!this.address){
                return;
            }
            if (this.contract && this.contract.getName()) {
                const tokenList = await this.$contractManager.getTokenList();
                tokenList.tokens.forEach((token) => {
                    if(token.address.toLowerCase() === this.contract.address.toLowerCase()){
                        this.logo = (token.logoURI);
                    }
                });
                const name = (this.contract.isToken() && this.contract.getProperties()?.symbol)
                    ? this.contract.getProperties().symbol
                    : this.contract.getName()
                ;
                if(name[0] === '0' && name[1] === 'x'){
                    this.displayName = this.truncate > 0 ? `${this.address.slice(0, this.truncate)}...` : this.address;
                    return;
                }
                this.displayName = this.truncate > 0 && name.length > this.truncate ?
                    `${name.slice(0, this.truncate)}...` :
                    `${name}`;
                return;
            }
            if (!this.address) {
                return '';
            }
            // This formats the address for us and handles zero padding we get from log events
            const address = ethers.utils.getAddress(this.address);
            this.displayName = this.truncate > 0 ? `${address.slice(0, this.truncate)}...` : address;
        },
        async loadContract() {
            this.contract = null;
            if (!this.isContractTrx) {
                let contract = await this.$contractManager.getCachedContract(this.address);
                if (contract) {
                    this.contract = contract;
                }
                return;
            }

            let contract = await this.$contractManager.getContract(this.address);
            if (contract) {
                this.contract = contract;
            }
        },

    },
};
</script>

<template>
<div :key="displayName" class="c-address-field">
    <router-link
        :to="`/address/${address}`"
        :class="highlight ? 'highlighted flex items-center' : 'flex items-center'"
        @click.capture.stop=""
    >
        <q-img
            v-if="logo"
            class="q-mr-xs"
            :src="getIcon(logo)"
            width="16px"
            height="16px"
        />
        <span>{{ displayName }}</span>
    </router-link>
    <CopyButton v-if="copy && address" :text="address" description="address"/>
</div>
</template>

<style lang="scss" scoped>
.c-address-field .q-icon {
    margin-right: 3px;
}
.c-address-field .q-img {
    border-radius: 100%;
}
.c-address-field a {
    vertical-align: middle;
}
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
