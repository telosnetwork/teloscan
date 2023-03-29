<script>
import { getIcon } from 'src/lib/token-utils';
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
        truncate: {
            type: Number,
            required: false,
            default: 3,
        },
    },
    methods: {
        getIcon,
    },
    async mounted() {
        this.valueRaw = this.value.toLocaleString(0, { useGrouping: false }).replace('.', '');
        if(this.address){
            const contract = await this.$contractManager.getContract(this.address);
            if(contract){
                this.valueShort = formatWei(this.valueRaw, contract.properties?.decimals, this.truncate);
                this.valueRaw = formatWei(this.valueRaw, contract.properties?.decimals);
                let logoURI = '';
                const tokenList = await this.$contractManager.getTokenList();
                tokenList.tokens.forEach((token) => {
                    if(token.address.toLowerCase() ===  contract.address.toLowerCase()){
                        logoURI = token.logoURI;
                    }
                });
                this.symbol = contract.properties?.symbol;
                this.logo = logoURI || '';
                return;
            }
        }
        this.valueShort = formatWei(this.valueRaw, 18, this.truncate);
        this.valueRaw = formatWei(this.valueRaw, 18);
        this.symbol = 'TLOS';
        this.logo = false;
    },
    data(){
        return {
            valueShort: this.valueShort,
            symbol: this.symbol,
            logo: this.logo,
            showWei: this.showWei,
            valueRaw: this.valueRaw,
        };
    },
};
</script>
<template>
<div v-if="symbol" class="clickable" @click="showWei = !showWei">
    <div v-if="!showWei">
        <span>
            {{ valueShort }}
            <q-img
                v-if="logo !== false"
                class="coin-icon"
                :src="getIcon(logo)"
            />
            {{ symbol }}
        </span>
        <q-tooltip>{{ $t('components.transaction.show_total') }}</q-tooltip>
    </div>
    <div v-else>
        <span>
            {{ valueRaw }}
        </span>
        <q-tooltip>{{ $t('components.transaction.show_short') }}</q-tooltip>
    </div>
</div>
</template>

<!--eslint-enable-->
<style scoped lang="sass">
    .coin-icon
        width: 16px
        height: 16px
        margin-top: -6px
        margin-left: 2px
        vertical-align: middle
        border-radius: 100%

</style>
