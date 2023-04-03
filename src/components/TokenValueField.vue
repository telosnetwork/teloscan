<script>
import { getIcon } from 'src/lib/token-utils';
import { BigNumber } from 'ethers';
import { formatWei } from 'src/lib/utils';
export default {
    name: 'TokenValueField',
    props: {
        value: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: false,
        },
        showWei: {
            type: Boolean,
            required: false,
        },
        truncate: {
            type: Number,
            required: false,
            default: 3,
        },
    },
    methods: {
        getIcon,
        BigNumber,
        shorten(value, decimals){
            let valueShort = formatWei(value, decimals, this.truncate);
            let valueRaw = formatWei(value, decimals);
            let parts = valueRaw.split('.');
            let compare = '0.';
            for (let i = 0; i < this.truncate - 1; i++) {
                compare += '0';
            }
            if (valueShort === (compare + '0') && parts[1]?.length > this.truncate) {
                valueShort = '< ' + compare + '1';
            }
            return valueShort;
        },
        async getLogo(contract){
            let logoURI = '';
            const tokenList = await this.$contractManager.getTokenList();
            tokenList.tokens.forEach((token) => {
                if(token.address.toLowerCase() ===  contract.address.toLowerCase()){
                    logoURI = token.logoURI;
                }
            });
            return logoURI;
        },
    },
    async mounted() {
        this.valueRaw = this.value.toLocaleString(0, { useGrouping: false }).replace('.', '');
        if(this.address){
            const contract = await this.$contractManager.getContract(this.address);
            if(contract){
                this.valueWei = BigNumber.from(this.value);
                this.valueShort = this.shorten(this.valueRaw, contract.properties?.decimals);
                this.valueRaw = formatWei(this.valueRaw, contract.properties?.decimals);
                this.symbol = contract.properties?.symbol;
                this.logo = await this.getLogo(contract);
                return;
            }
        }
        this.valueShort = formatWei(this.valueRaw, 18, this.truncate);
        this.valueRaw = formatWei(this.valueRaw, 18);
        this.valueWei = this.value;
        this.symbol = 'TLOS';
        this.logo = false;
    },
    data(){
        return {
            valueShort: this.valueShort,
            valueRaw: this.valueRaw,
            valueWei: this.valueWei,
            symbol: this.symbol,
            logo: this.logo,
            displaySwitch: this.displaySwitch,
        };
    },
};
</script>
<template>
<span v-if="symbol" >
    <span v-if="!displaySwitch">
        <span class="clickable" @click="displaySwitch = !displaySwitch">
            <span>
                {{ valueShort }}
                <q-img
                    v-if="logo !== false"
                    class="coin-icon"
                    :src="getIcon(logo)"
                />
            </span>
            <q-tooltip v-if="!showWei">{{ $t('components.transaction.show_total') }}</q-tooltip>
            <q-tooltip v-else >{{ $t('components.transaction.show_wei') }}</q-tooltip>
        </span>
        <router-link v-if="symbol != 'TLOS'" :to="`/address/${address}`">
            <span>{{ symbol.slice(0, 6) }}</span>
            <span v-if="symbol.length > 6">...</span>
        </router-link>
        <span v-else>TLOS</span>
    </span>
    <span v-else class="clickable" @click="displaySwitch = !displaySwitch">
        <span v-if="!showWei">
            {{ valueRaw }}
        </span>
        <span v-else>
            {{ valueWei }}
        </span>
        <q-tooltip v-if="!showWei">{{ $t('components.transaction.show_short') }}</q-tooltip>
        <q-tooltip v-else>{{ $t('components.transaction.show_total') }}</q-tooltip>
    </span>
</span>
</template>

<!--eslint-enable-->
<style scoped lang="sass">
    .coin-icon
        width: 16px
        height: 16px
        margin-top: -6px
        margin-right: 3px
        vertical-align: middle
        border-radius: 100%
</style>
