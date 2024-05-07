<script>
import { promptAddToMetamask } from 'src/lib/token-utils';
import MetamaskLogo from 'src/assets/metamask-fox.svg';

export default {
    name: 'AddToMetamask',
    props: {
        token: {
            type: Object,
            required: true,
        },
        icon: {
            type: Boolean,
            default: false,
        },
        label: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            logo: MetamaskLogo,
        };
    },
    computed: {
        showMetamaskPrompt() {
            return window?.ethereum?.isMetaMask === true;
        },
    },
    methods: {
        promptAddToMetamask(address, symbol, logoURI, type, decimals) {
            promptAddToMetamask(this.$q, address, symbol, logoURI, type, decimals);
        },
    },
};
</script>

<template>
<div v-if="showMetamaskPrompt" class="c-metamask-prompt">
    <span v-if="icon">
        <q-img
            :src="logo"
            @click="promptAddToMetamask(token.address, token.symbol, token.logoURI, token.type, token.decimals)"
        />
        <q-tooltip>{{ label }}</q-tooltip>
    </span>
    <span
        v-else
        tabindex="0"
        :aria-label="label"
        @click="promptAddToMetamask(token.address, token.symbol, token.logoURI, token.type, token.decimals)"
    >
        {{ label }}
    </span>
</div>
</template>

<style lang='scss' scoped>
.c-metamask-prompt{
    color: $secondary;
    cursor: pointer;

    .q-img:hover{
        filter: grayscale(0);
    }

    .q-img{
        width: 32px;
        height: 32px;
        filter: grayscale(1);
        transition: 1s filter ease;
    }
}
</style>
