<script>
import AddressField from 'components/AddressField';
import { promptAddToMetamask } from 'src/lib/token-utils';
import { formatWei } from 'src/lib/utils';

export default {
    name: 'TokenList',
    components: {AddressField},
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            tokens: null,
        }
    },
    computed: {
        showMetamaskPrompt() {
            return window?.ethereum?.isMetaMask === true;
        },
    },
    mounted() {
        this.loadTokens();
    },
    methods: {
        promptAddToMetamask,
        async loadTokens() {
            const tokenList = await this.$contractManager.getTokenList();
            let tokens = tokenList.tokens
            tokens = this.sortTokens(tokens);
            await Promise.all(tokens.map(async token => {
                if (token.logoURI && token.logoURI.startsWith('ipfs://'))
                    token.logoURI = `https://ipfs.io/ipfs/${token.logoURI.replace(/ipfs:\/\//, '')}`
                else if (!token.logoURI)
                    token.logoURI = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT28t_CidqCQ0st_OhY3MxnPKMFjclG9ppwWA&usqp=CAU';

                const contract = await this.$contractManager.getContract(token.address);
                const contractInstance = contract.getContractInstance();

                try {
                    const balance = await contractInstance.balanceOf(this.address);
                    token.balance = `${formatWei(balance, token.decimals, 4)}`;
                    token.fullBalance = `${formatWei(balance, token.decimals)}`;
                } catch (e) {
                    throw `Failed to fetch balance:\n${e}`
                }
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
        },
    },
}
</script>

<template>
<div class="q-pa-md row items-start q-gutter-md">
    <div
        v-for="{ name, logoURI, address, balance, symbol, fullBalance, type, decimals } in tokens"
        :key="address"
    >
        <div class="col">
            <q-card>
                <q-card-section class="u-flex--center-y">
                    <q-avatar class="q-mr-md">
                        <img :src="logoURI" alt="Token Logo">
                    </q-avatar>
                    <div>
                        <div class="text-h6">
                            {{ name }}
                        </div>
                        <address-field :address="address" class="q-mb-sm"/>
                        <div class="q-mb-sm">
                            <span class="q-pr-xs">
                                Balance:
                            </span>
                            <span v-if="balance === '0.0000'">
                                {{ '< 0.0001 ' + symbol }}
                            </span>
                            <span v-else>
                                {{ balance + ' ' + symbol || '(error fetching balance)' }}
                            </span>
                            <q-tooltip v-if="fullBalance > balance">
                                {{ fullBalance + ' ' + symbol || 'error fetching balance' }}
                            </q-tooltip>
                        </div>
                        <span
                            v-if="showMetamaskPrompt"
                            class="c-token-list__metamask-prompt"
                            tabindex="0"
                            :aria-label="`Launch MetaMask dialog to add ${symbol}`"
                            @click="promptAddToMetamask(address, symbol, logoURI, type, decimals)"
                        >
                            Track {{ symbol }} in MetaMask
                        </span>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-token-list {
    &__metamask-prompt {
        color: $secondary;
        cursor: pointer ;
    }
}
</style>
