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
            symbol: (this.token?.symbol?.length > 12) ? this.token.symbol.slice(0, 12).trim() + '...' : this.token.symbol,
        };
    },
};
</script>

<template>
<div v-if="element?.balance" class="c-token">
    <q-card class="c-token__token-card">
        <q-card-section class="c-token__token-card-section">
            <q-avatar class="c-token__token-card-avatar">
                <q-img :src="element.logoURI" :alt="element.name + ' Token Logo'" class="c-token__token-card-icon" />
            </q-avatar>
            <div class="c-token__info">
                <div class="c-token__name-container" :title="element.name">
                    <div class="c-token__name">{{ this.token.name }}</div>
                    <AddressField
                        :truncate="16"
                        :address="element.address"
                        :name="symbol"
                        :useHighlight="false"
                        class="c-token__address"
                    />
                </div>
                <div class="c-token__numbers">
                    <div class="c-token__numbers-balance">
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
                    <div class="c-token__numbers-usd">
                        <span v-if="element.valueUSD" >{{ element.valueUSD }} $</span>
                        <span v-else>-</span>
                    </div>
                </div>
                <AddToWallet
                    :token="element"
                    :icon="false"
                    :label="$t('components.add_to_metamask', { symbol: symbol })"
                    class="c-token__add-to-wallet"
                />
            </div>
        </q-card-section>
    </q-card>
</div>
</template>

<style lang="scss">
.c-token {
    overflow: auto;
    &__token-card {
        display: block;
    }
    &__token-card-section {
        display: flex;
    }
    &__token-card-avatar {
        margin: 0px 10px;
        height: auto;
        flex-shrink: 0;
    }
    &__token-card-icon {
        width: 100% !important;
        height: auto !important;
    }
    &__info {
        flex-grow: 1;
        min-width: 0;
    }
    &__name-container {
        display: flex;
        flex-direction: column;
        align-items: baseline;
        max-width: 100%;
        overflow: hidden;
    }
    &__name {
        font-size: 1.25rem;
        font-weight: 500;
        letter-spacing: .0125em;
        line-height: 2rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }
    &__address {
        display: block;
    }
    &__numbers {
        display: block;
        &-balance {
            display: block;
        }
        &-usd {
            display: block;
            color: var(--grey-text-color);
            font-size: 0.86em;
        }
    }
    &__add-to-wallet {
        display: block;
    }
}
</style>
