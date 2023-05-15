<script>
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
        this.tokenList = await this.$contractManager.getTokenList();
        await this.loadContract();
        await this.getDisplay();
    },
    methods: {
        getIcon,
        truncateText(text, middle){
            if(this.truncate === 0 || text.length <= this.truncate){
                return text;
            }
            if(middle){
                return `${text.slice(0, (this.truncate / 2))}...${
                    text.slice(text.length - (this.truncate / 2), text.length)
                }`;
            }
            return `${text.slice(0, this.truncate)}...`;
        },
        async getDisplay() {
            if (this.name) {
                this.displayName = this.truncateText(this.name);
                return;
            }
            if(!this.address){
                return;
            }
            let address = this.address;
            if (this.contract && this.contract.getName() && this.contract.getName().length > 0) {
                if(this.tokenList?.tokens){
                    this.tokenList.tokens.forEach((token) => {
                        if(token.address.toLowerCase() === this.contract.address.toLowerCase()){
                            this.logo = (token.logoURI);
                        }
                    });
                }
                this.logo = (this.logo === null && this.contract.getSupportedInterfaces().includes('erc20'))
                    ? ''
                    : this.logo
                ;
                const name = (this.contract.isToken() && this.contract.getProperties()?.symbol)
                    ? this.contract.getProperties().symbol
                    : this.contract.getName()
                ;
                if(!name.startsWith('0x')){
                    this.displayName = this.truncateText(name);
                    return;
                }
            }
            // This formats the address for us and handles zero padding we get from log events
            this.displayName = this.truncateText(address, true);
        },
        async loadContract() {
            let contract = await this.$contractManager.getContract(this.address);
            if (contract) {
                this.fullName = (contract.getName() && contract.getName().startsWith('0x') === false)
                    ? contract.getName()
                    : this.fullName
                ;
                this.contract = contract;
            }
        },

    },
};
</script>

<template>
<div :class="`c-address-field ${this.class}`">
    <router-link
        :key="displayName"
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
        <q-tooltip v-if="fullName !== displayName">{{ fullName }}</q-tooltip>
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
