<script>
import { formatWei } from 'src/lib/utils';
import erc20Abi from 'erc-20-abi';
import DEFAULT_TOKEN_LOGO from 'src/assets/evm_logo.png';
import TokenGridElement from 'src/components/Token/TokenGridElement';
import TokenTable from 'src/components/Token/TokenTable';
import { BigNumber } from 'ethers';

export default {
    name: 'TokenList',
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    components: { TokenGridElement, TokenTable },
    data() {
        return {
            tokensOfficial: null,
            tokens: null,
            processing: false,
            showGrid: true,
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
        async loadTokens(force) {
            if(this.processing || this.tokens !== null && !force ||this.address === null){
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
            await Promise.all(response.data.results.map(async (result) => {
                if(result.balance !== '0'){
                    let token = this.checkTokenList(result.contract.toLowerCase(), tokenList);
                    if(token && !tokensOfficial.includes(token)){
                        token.balance = result.balance;
                        tokensOfficial.push(token);
                    } else if(!tokens.includes(result) && result.contract !== '___NATIVE_CURRENCY___'){
                        let contract = await this.$contractManager.getContract(result.contract);
                        result.address = contract.address;
                        result.name = contract.name;
                        result.symbol = contract.properties?.symbol;
                        result.decimals = contract.properties?.decimals;
                        result.contract = await this.$contractManager.getContract(result.contract);
                        result.price = contract.properties?.price || 0;
                        result.logoURI = DEFAULT_TOKEN_LOGO;
                        result.fullBalance = `${formatWei(result.balance, result.contract.properties?.decimals)}`;
                        result.balance = `${formatWei(result.balance, result.contract.properties?.decimals, 4)}`;
                        tokens.push(result);
                    }
                }
            }));
            tokens = this.sortTokens(tokens);
            tokensOfficial = await Promise.all(tokensOfficial.map(async (token) => {
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
                token.price = contract.properties?.price ||  0;
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
                return token;
            }));
            tokensOfficial = this.sortTokens(tokensOfficial);
            this.tokensOfficial = tokensOfficial;
            this.tokens = tokens;
            this.processing = false;
        },
        sortTokens(tokens) {
            return tokens.sort((a, b) => {
                let balanceA = a.fullBalance.toString().split('.')[0];
                let balanceB = b.fullBalance.toString().split('.')[0];
                if(balanceA === '0' && balanceB === '0'){
                    balanceA = a.fullBalance.toString().split('.')[1];
                    balanceB = b.fullBalance.toString().split('.')[1];
                }
                return (
                    BigNumber.from(balanceA).lt(BigNumber.from(balanceB))
                        ? 1 : -1
                );
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
    <div class="flex q-px-md q-mt-sm">
        <q-toggle
            v-model="showGrid"
            :label="(showGrid) ? $t('global.show_table') : $t('global.show_grid')"
            checked-icon="table_rows"
            unchecked-icon="apps"
            color="secondary"
        />
    </div>
    <div v-if="tokensOfficial.length > 0" :key="'otokenslist' + showGrid" class="c-token-list-container">
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
        <div v-else class="c-token-table">
            <TokenTable :tokens="tokensOfficial" />
        </div>
    </div>
    <div v-if="tokens.length > 0" :key="'tokenslist' + showGrid" class="c-token-list-container">
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
        <div v-else class="c-token-table">
            <TokenTable :tokens="tokens" />
        </div>
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
