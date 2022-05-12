<script>
import AddressField from "components/AddressField";
import {formatBN} from "src/lib/utils";

export default {
    name: "TokenList",
    components: {AddressField},
    props: {
        address: {
            type: String,
            required: true,
        }
    },
    data() {
        return {
            tokens: null
        }
    },
    mounted() {
        this.loadTokens();
    },
    methods: {
        async loadTokens() {
            const tokenList = await this.$contractManager.getTokenList();
            let tokens = tokenList.tokens
            tokens = this.sortTokens(tokens);
            await Promise.all(tokens.map(async token => {
                if (token.logoURI && token.logoURI.startsWith("ipfs://"))
                    token.logoURI = `https://ipfs.io/ipfs/${token.logoURI.replace(/ipfs:\/\//, '')}`
                else if (!token.logoURI)
                    token.logoURI = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT28t_CidqCQ0st_OhY3MxnPKMFjclG9ppwWA&usqp=CAU';

                const contract = await this.$contractManager.getContract(token.address);
                const contractInstance = contract.getContractInstance();
                const balance = await contractInstance.balanceOf(this.address);
                token.balance = `${formatBN(balance, token.decimals, 5)} ${token.symbol}`;
            }));
            this.tokens = tokens;
        },
        sortTokens(tokens) {
            return tokens.sort((a, b) => {
                if (a.symbol === 'WTLOS')
                    return -1;

                if (b.symbol === 'WTLOS')
                    return 1;

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
            })
        }
    }
}
</script>

<template lang="pug">
  .q-pa-md.row.items-start.q-gutter-md
     div(v-for="token in tokens" :key="token.address" )
       .col
         q-card()
          q-card-section()
            q-avatar()
              img( :src="token.logoURI" )
            .text-h6
              div() {{ token.name }}
            address-field( :address="token.address" )
            div() Balance: {{ token.balance }}
</template>

<style lang="sass" scoped>
.token-card
  width: 100%
  max-width: 250px
</style>
