<script>
import AddressField from 'components/AddressField';
import { promptAddToMetamask } from 'src/lib/token-utils';
import { formatWei } from 'src/lib/utils';

export default {
    name: 'TokenList',
    components: { AddressField },
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            tokens: null,
        };
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
        promptAddToMetamask(address, symbol, logoURI, type, decimals) {
            promptAddToMetamask(this.$q, address, symbol, logoURI, type, decimals);
        },
        async loadTokens() {
            const tokenList = await this.$contractManager.getTokenList();
            let tokens = tokenList.tokens;
            tokens = this.sortTokens(tokens);
            await Promise.all(tokens.map(async (token) => {
                if (token.logoURI && token.logoURI.startsWith('ipfs://')) {
                    token.logoURI = `https://ipfs.io/ipfs/${token.logoURI.replace(/ipfs:\/\//, '')}`;
                } else if (!token.logoURI) {
                    // eslint-disable-next-line max-len
                    token.logoURI = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT28t_CidqCQ0st_OhY3MxnPKMFjclG9ppwWA&usqp=CAU';
                }

                const contract = await this.$contractManager.getContract(token.address);
                const contractInstance = contract.getContractInstance();

                try {
                    const balance = await contractInstance.balanceOf(this.address);
                    token.balance = `${formatWei(balance, token.decimals, 4)}`;
                    token.fullBalance = `${formatWei(balance, token.decimals)}`;
                } catch (e) {
                    throw `Failed to fetch balance:\n${e}`;
                }
            }));
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
<div class="c-token-list">
    <div
        v-for="{ name, logoURI, address, balance, symbol, fullBalance, type, decimals } in tokens"
        :key="address"
        class="c-token-list__token-card"
    >
        <q-card>
            <q-card-section class="u-flex--center-y">
                <q-avatar class="q-mr-md">
                    <img :src="logoURI" alt="Token Logo">
                </q-avatar>
                <div class="c-token-list__token-info-container">
                    <div class="text-h6 c-token-list__token-name" :title="name">
                        {{ name }}
                    </div>
                    <AddressField :address="address" class="q-mb-sm"/>
                    <div class="q-mb-sm">
                        <span class="q-pr-xs">
                            {{ $t('components.balance') }}
                        </span>
                        <span v-if="balance === '0.0000'">
                            {{ '< 0.0001 ' + symbol }}
                        </span>
                        <span v-else>
                            {{ balance + ' ' + symbol || $t('components.error_fetching_balance') }}
                        </span>
                        <q-tooltip v-if="fullBalance > balance">
                            {{ fullBalance + ' ' + symbol || $t('components.error_fetching_balance') }}
                        </q-tooltip>
                    </div>
                    <span
                        v-if="showMetamaskPrompt"
                        class="c-token-list__metamask-prompt"
                        tabindex="0"
                        :aria-label="$t('components.launch_metamask_dialog_to_add', { symbol })"
                        @click="promptAddToMetamask(address, symbol, logoURI, type, decimals)"
                    >
                        {{ $t('components.add_to_metamask', { symbol }) }}
                    </span>
                </div>
            </q-card-section>
        </q-card>
    </div>
</div>
</template>

<style lang="scss">
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

    &__token-card {
        min-width: 0;
    }

    &__token-name {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__token-info-container {
        overflow: hidden;
        white-space: nowrap;
    }

    &__metamask-prompt {
        color: $secondary;
        cursor: pointer ;
    }
}
</style>
