<script>
import { formatWei } from 'src/lib/utils';
import erc20Abi from 'erc-20-abi';
import DEFAULT_TOKEN_LOGO from 'src/assets/evm_logo.png';
import TokenListElement from 'src/components/Token/TokenListElement';

export default {
    name: 'TokenList',
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    components: { TokenListElement },
    data() {
        return {
            tokensOfficial: null,
            tokens: null,
            processing: false,
        };
    },
    async mounted() {
        await this.loadTokens();
    },
    methods: {
        checkTokenList(address, tokenList){
            return tokenList.tokens.filter((token) => {
                if(address.toLowerCase() === token.address.toLowerCase()){
                    return token;
                }
            })[0];
        },
        async loadTokens() {
            if(this.processing || this.tokens !== null ||this.address === null){
                return;
            }
            this.processing = true;
            const tokenList = await this.$contractManager.getTokenList();
            const response = await this.$indexerApi.get(`/account/${this.address}/balances?limit=1000`);
            if(response.data?.contracts){
                this.$contractManager.addContractsToCache(response.data.contracts);
            }
            let tokens = [];
            let tokensOfficial = [];
            response.data.results.forEach(async (result) => {
                if(result.balance !== '0'){
                    let found = false;
                    let token = this.checkTokenList(result.contract.toLowerCase(), tokenList);
                    if(token && !tokensOfficial.includes(token)){
                        token.balance = result.balance;
                        tokensOfficial.push(token);
                        found = true;
                    }
                    if(!found && !tokens.includes(result) && result.contract !== '___NATIVE_CURRENCY___'){
                        let contract = await this.$contractManager.getContract(result.contract);
                        result.name = contract.name;
                        result.symbol = contract.properties?.symbol;
                        result.decimals = contract.properties?.decimals;
                        result.contract = await this.$contractManager.getContract(result.contract);
                        result.logoURI = DEFAULT_TOKEN_LOGO;
                        result.fullBalance = `${formatWei(result.balance, result.contract.properties?.decimals)}`;
                        result.balance = `${formatWei(result.balance, result.contract.properties?.decimals, 4)}`;
                        tokens.push(result);
                    }
                }
            });
            tokensOfficial = this.sortTokens(tokensOfficial);
            await Promise.all(tokensOfficial.map(async (token) => {
                if (token.logoURI && token.logoURI.startsWith('ipfs://')) {
                    token.logoURI = `https://ipfs.io/ipfs/${token.logoURI.replace(/ipfs:\/\//, '')}`;
                } else if (!token.logoURI) {
                    // eslint-disable-next-line max-len
                    token.logoURI = DEFAULT_TOKEN_LOGO;
                }

                const contract = await this.$contractManager.getContract(token.address);
                if(!contract.supportedInterfaces.includes('erc20')){
                    return;
                }
                if(!contract.abi){
                    contract.abi = erc20Abi;
                }

                const balance = token.balance;
                if(balance === 0){
                    tokensOfficial.remove(token);
                } else {
                    token.balance = `${formatWei(balance, token.decimals, 4)}`;
                    token.fullBalance = `${formatWei(balance, token.decimals)}`;
                }
            }));
            this.tokensOfficial = tokensOfficial;
            this.tokens = tokens;
        },
        sortTokens(tokens) {
            return tokens.sort((a, b) => {
                if (a.symbol === 'WTLOS') {
                    return -1;
                }

                if (b.symbol === 'WTLOS') {
                    return 1;
                }

                if (a.tags.includes('stablecoin') && !b.tags.includes('stablecoin')) {
                    return -1;
                }

                if (!a.tags.includes('stablecoin') && b.tags.includes('stablecoin')) {
                    return 1;
                }

                if (a.tags.includes('telosevm') && !b.tags.includes('telosevm')) {
                    return 1;
                }

                if (!a.tags.includes('telosevm') && b.tags.includes('telosevm')) {
                    return -1;
                }

                return a.symbol > b.symbol ? 1 : -1;
            });
        },
    },
};
</script>

<template>
<div v-if="!tokensOfficial" class="row">
    <div class="col-12 flex items-center justify-center">
        <q-spinner size="md" class="q-mb-xl q-mt-xl" />
    </div>
</div>
<div v-else-if="tokensOfficial.length === 0 && tokens.length === 0" class="row">
    <div class="col-12 flex items-center justify-center">
        <q-icon class="fa fa-info-circle" size="md" />
        <h5 class="text-center  q-mb-xl q-mt-xl q-ml-md"> {{ $t('components.no_balances_found') }}</h5>
    </div>
</div>
<div v-else>
    <div v-if="tokensOfficial.length > 0" class="c-token-list-container">
        <div class="c-token-list">
            <TokenListElement
                v-for="token in tokensOfficial"
                :key="token.address"
                :token="token"
            />
        </div>
    </div>
    <div v-if="tokens.length > 0" class="c-token-list-container">
        <div class="col-12 flex q-mt-md q-pl-lg">
            <h5 class="text-left"> {{ $t('components.other_tokens') }}</h5>
        </div>
        <div class="c-token-list">
            <TokenListElement
                v-for="token in tokens"
                :key="token.address"
                :token="token"
            />
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-token-list-container h5 {
    margin: 0;
}
.c-token-list {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(1, 1fr);

    padding: 24px;

    @media screen and (min-width: $breakpoint-sm-min) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media screen and (min-width: $breakpoint-lg-min) {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>
