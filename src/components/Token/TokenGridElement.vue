<script>
import AddressField from 'components/AddressField';
import AddToMetamask from 'src/components/AddToMetamask';

export default {
    name: 'TokenGridElement',
    components: { AddressField, AddToMetamask },
    props: {
        token: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            symbol: (this.token.symbol.length > 12) ? this.token.symbol.slice(0, 12).trim() + '...' : this.token.symbol,
        };
    },
};
</script>

<template>
<div v-if="token.balance" class="c-token-list__token-card">
    <q-card >
        <q-card-section class="flex">
            <q-avatar class="q-mr-md">
                <img :src="token.logoURI" :alt="token.name + ' Token Logo'">
            </q-avatar>
            <div class="c-token-list__token-info-container">
                <div class="text-h6 c-token-list__token-name" :title="token.name">
                    <span v-if="token.name.length < 17">{{ token.name }}</span>
                    <span v-else>
                        <span>{{ token.name.slice(0, 17) }}</span>
                        <span>...</span>
                        <q-tooltip>{{ token.name }}</q-tooltip>
                    </span>
                </div>
                <AddressField :address="token.address" :name="symbol" class="q-mb-sm"/>
                <div class="q-mb-sm">
                    <span class="q-pr-xs">
                        {{ $t('components.balance') }}
                    </span>
                    <span v-if="token.balance === '0.0000' && token.fullBalance > 0">
                        {{ '< 0.0001 ' + symbol }}
                    </span>
                    <span v-else>
                        {{ token.balance + ' ' + symbol || $t('components.error_fetching_balance') }}
                    </span>
                    <q-tooltip v-if="fullBalance > balance">
                        {{ token.fullBalance + ' ' + symbol || $t('components.error_fetching_balance') }}
                    </q-tooltip>
                </div>
                <AddToMetamask
                    :token="token"
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
