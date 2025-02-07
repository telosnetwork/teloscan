<script>
import { markRaw } from 'vue';
import { formatWei } from 'src/lib/utils';
import erc20Abi from 'erc-20-abi';
import DEFAULT_TOKEN_LOGO from 'assets/logo--teloscan.png';
import TokenGridElement from 'src/components/Token/TokenGridElement';
import TokenTable from 'src/components/Token/TokenTable';
import BigDecimal from 'js-big-decimal';
import EmptyTableSign from 'components/EmptyTableSign';
import { useChainStore } from 'src/core';

export default {
    name: 'TokenList',
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    components: {
        TokenGridElement,
        TokenTable,
        EmptyTableSign,
    },
    data() {
        return {
            processing: false,
            showGrid: false,
            tokens: false,
            tokensOfficial: false,
        };
    },
    async mounted() {
        await this.loadTokens();
    },

    // if the url network parameter changes, we need to reload the tokens
    watch: {
        '$route.query.network': {
            handler() {
                this.tokens = false;
                this.tokensOfficial = false;
                this.loadTokens();
            },
        },
    },
    methods: {
        checkTokenList(address, tokenList){
            return tokenList.tokens.filter((token) => {
                if(address.toLowerCase() === token.address.toLowerCase()){
                    return markRaw(token);
                }
            })[0];
        },
        async loadTokens() {
            if(this.tokensOfficial !== false || this.tokens !== false || this.processing || this.address === null){
                return;
            }
            this.processing = true;
            const tokenList = await useChainStore().currentChain.settings.getContractManager().getTokenList();
            const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
            const response = await indexerApi.get(`/v1/account/${this.address}/balances?limit=1000`);
            let tokens = [];
            let tokensOfficial = [];
            const contractManager = useChainStore().currentChain.settings.getContractManager();
            await Promise.all(await response.data.results.map(async (result) => {
                let token = this.checkTokenList(result.contract.toLowerCase(), tokenList);
                if(token){
                    const contract = await contractManager.getContract(token.address, true);
                    if(!contract || !contract.supportedInterfaces.includes('erc20')){
                        return;
                    }
                    token.price = contract.properties?.price || 0;
                    token.balance = `${formatWei(result.balance, token.decimals, 4)}`;
                    token.fullBalance = `${formatWei(result.balance, token.decimals)}`;
                    if(token.price && parseFloat(token.price) > 0){
                        token.valueUSD = `${Math.round((token.price * token.fullBalance) * 10000) / 10000}`;
                        token.fullValueUSD = (token.valueUSD !== '0.0')
                            ? new BigDecimal(token.price).multiply(new BigDecimal(token.fullBalance)).getValue()
                            : '0'
                        ;
                    }
                    if (token.logoURI && token.logoURI.startsWith('ipfs://')) {
                        token.logoURI = `https://ipfs.io/ipfs/${token.logoURI.replace(/ipfs:\/\//, '')}`;
                    } else if (!token.logoURI) {
                        token.logoURI = DEFAULT_TOKEN_LOGO;
                    }
                    if(!contract.abi){
                        contract.abi = erc20Abi;
                    }
                    tokensOfficial.push(token);
                    return token;
                } else if(result.contract !== '___NATIVE_CURRENCY___'){
                    try {
                        let contract = await contractManager.getContract(result.contract);
                        result.address = contract.address;
                        result.name = contract.name;
                        result.symbol = contract.properties?.symbol;
                        result.decimals = contract.properties?.decimals;
                        result.price = contract.properties?.price || 0;
                        result.contract = contract;
                        result.logoURI = DEFAULT_TOKEN_LOGO;
                        result.fullBalance = `${formatWei(result.balance, result.contract.properties?.decimals)}`;
                        result.balance = `${formatWei(result.balance, result.contract.properties?.decimals, 4)}`;
                        tokens.push(result);
                    } catch (e) {
                        console.error('Error loading token', {
                            error: e,
                            contract: result.contract,
                            token: result,
                        });
                        return result;
                    }
                    return result;
                }
            }));
            this.tokensOfficial = this.sortTokens(tokensOfficial, 'valueUSD');
            this.tokens = this.sortTokens(tokens, 'balance');
            this.processing = false;
        },
        sortTokens(tokens, key) {
            if(key === 'balance'){
                return tokens.sort((a, b) => new BigDecimal(b.fullBalance)
                    .compareTo(new BigDecimal(a.fullBalance)));
            } else {
                return tokens.sort((a, b) => {
                    if(!a.fullValueUSD && !b.fullValueUSD){
                        return new BigDecimal(b.fullBalance).compareTo(new BigDecimal(a.fullBalance));
                    }
                    return new BigDecimal(b.fullValueUSD || '0')
                        .compareTo(new BigDecimal(a.fullValueUSD || '0'));
                });
            }
        },
    },
};
</script>

<template>
<div v-if="!tokensOfficial || !tokens" class="row">
    <div class="col-12 flex items-center justify-center">
        <q-spinner size="md" class="q-mb-xl q-mt-xl" />
    </div>
</div>
<div v-else-if="tokensOfficial.length === 0 && tokens?.length === 0" class="row">
    <div class="col-12 flex items-center justify-center">
        <EmptyTableSign />
    </div>
</div>
<div v-else>
    <div class="flex q-px-md q-mt-sm">
        <q-toggle
            v-model="showGrid"
            :label="(showGrid) ? $t('global.show_table') : $t('global.show_grid')"
            checked-icon="table_rows"
            unchecked-icon="apps"
            color="primary"
        />
    </div>
    <div v-if="showGrid">
        <div v-if="tokensOfficial.length > 0" class="c-token-list-container">
            <div class="col-12 flex q-mt-md q-pl-lg">
                <h5 class="text-left"> {{ $t('components.known_tokens') }}</h5>
            </div>
            <div v-if="showGrid" class="c-token-grid">
                <TokenGridElement
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
            <div v-if="showGrid" class="c-token-grid" >
                <TokenGridElement
                    v-for="token in tokens"
                    :key="token.address"
                    :token="token"
                />
            </div>
        </div>
    </div>
    <div v-else class="c-token-table">
        <TokenTable :tokens="tokensOfficial.concat(tokens)" />
    </div>
</div>
</template>

<style lang="scss">
.c-token-list-container h5 {
    margin: 0;
}
.c-token-grid {
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
