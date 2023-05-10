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
        class: {
            type: String,
            default: '',
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
            default: 0,
        },
        isContractTrx: {
            type: Boolean,
            default: false,
        },
    },
    data: () => ({
        contract: null,
        logo: null,
        tokenList: null,
        displayName: null,
        fullName: null,
    }),
    watch: {
        address () {
            this.loadContract();
        },
    },
    async mounted() {
        this.fullName = this.address;
        console.log(this.fullName);
        this.tokenList = await this.$contractManager.getTokenList();
        await this.loadContract();
        console.log(this.fullName);
        await this.getDisplay();
        console.log(this.fullName);
    },
    methods: {
        getIcon,
        truncateText(text, middle){
            if(middle){
                return `${text.slice(0, (this.truncate / 2))}...${
                    text.slice(text.length - (this.truncate / 2), text.length)
                }`;
            }
            return `${text.slice(0, this.truncate)}...`;
        },
        async getDisplay() {
            if (this.name) {
                this.displayName = this.truncate > 0 && this.name.length > this.truncate
                    ? this.truncateText(this.name)
                    : `${this.name}`;
                return;
            }
            if(!this.address){
                return;
            }
            let address = this.address;
            if (this.contract && this.contract.getName() && this.contract.getName().length > 0) {
                this.tokenList.tokens.forEach((token) => {
                    if(token.address.toLowerCase() === this.contract.address.toLowerCase()){
                        this.logo = (token.logoURI);
                    }
                });
                this.logo = (this.logo === null && this.contract.getSupportedInterfaces().includes('erc20'))
                    ? ''
                    : this.logo
                ;
                const name = (this.contract.isToken() && this.contract.getProperties()?.symbol)
                    ? this.contract.getProperties().symbol
                    : this.contract.getName()
                ;
                if(name[0] === '0' && name[1] === 'x'){
                    this.displayName = this.truncate > 0
                        ? this.truncateText(address, true)
                        : address;
                    return;
                }
                this.displayName = this.truncate > 0 && name.length > this.truncate
                    ? this.truncateText(this.name)
                    : `${name}`;
                return;
            }
            // This formats the address for us and handles zero padding we get from log events
            const addressStr = ethers.utils.getAddress(address);
            this.displayName = this.truncate > 0
                ? this.truncateText(addressStr, true)
                : addressStr
            ;
        },
        async loadContract() {
            let contract = await this.$contractManager.getContract(this.address);
            if (contract) {
                this.fullName = (contract.getName().startsWith('0x') === false) ? contract.getName() : this.fullName;
                this.contract = contract;
            }
        },

    },
};
</script>

<template>
<div :class="`c-address-field ${this.class}`">
    <router-link
        :to="`/address/${address}`"
        :class="highlight ? 'highlighted flex items-center' : 'flex items-center'"
        @click.capture.stop=""
    >
        <q-img
            v-if="logo !== null"
            class="q-mr-xs"
            :src="getIcon(logo)"
            width="16px"
            height="auto"
        />
        <span>{{ displayName }}</span>
        <q-tooltip v-if="truncate">{{ fullName }}</q-tooltip>
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
