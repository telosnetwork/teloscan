<script>
import AddressField from 'src/components/AddressField';
import AddToWallet from 'src/components/AddToWallet';

export default {
    name: 'TokenGridElement',
    components: { AddressField, AddToWallet },
    props: {
        token: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            element: { ...this.token },
            symbol: (this.token.symbol.length > 12) ? this.token.symbol.slice(0, 12).trim() + '...' : this.token.symbol,
        };
    },
};
</script>

<template>
<div v-if="element?.balance" class="c-token-list__token-card">
    <q-card >
        <q-card-section class="flex">
            <q-avatar class="q-mr-md">
                <img :src="element.logoURI" :alt="element.name + ' Token Logo'">
            </q-avatar>
            <div class="c-token-list__token-info-container">
                <div class="text-h6 c-token-list__token-name" :title="element.name">
                    <span v-if="element.name.length < 17">{{ this.token.name }}</span>
                    <span v-else>
                        <span>{{ this.token.name.slice(0, 17) }}</span>
                        <span>...</span>
                        <q-tooltip>{{ this.token.name }}</q-tooltip>
                    </span>
                </div>
                <AddressField :address="element.address" :name="symbol" class="q-mb-sm"/>
                <div>
                    <div class="flex">
                        <span v-if="element.balance === '0.0000' && element.fullBalance > 0">
                            {{ '< 0.0001 ' + symbol }}
                        </span>
                        <span v-else>
                            {{ element.balance + ' ' + symbol || $t('components.error_fetching_balance') }}
                        </span>
                        <q-tooltip v-if="element.fullBalance > element.balance">
                            {{ element.fullBalance + ' ' + symbol || $t('components.error_fetching_balance') }}
                        </q-tooltip>
                    </div>
                    <div class="text-grey q-mb-sm">
                        <span v-if="element.valueUSD" >{{ element.valueUSD }} $</span>
                        <span v-else>-</span>
                    </div>
                </div>
                <AddToWallet
                    :token="element"
                    :icon="false"
                    :label="$t('components.add_to_metamask', { symbol: symbol })"
                />
            </div>
        </q-card-section>
    </q-card>
</div>
</template>

<style lang="scss">
.c-token-list {
    &__token-card {
        min-width: 0;
        .text-grey {
            font-size: 0.8em;
        }
    }
    &__token-name {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__token-info-container {
        overflow: hidden;
        white-space: nowrap;
    }
}
</style>
