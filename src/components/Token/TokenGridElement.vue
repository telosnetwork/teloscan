<script>
import AddressField from 'src/components/AddressField';
import AddToMetamask from 'src/components/AddToMetamask';
import { BigDecimal } from 'src/lib/BigDecimal';

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
        let element = this.token;
        element.valueUSD = false;
        if(this.token.price){
            let valueUSD = new BigDecimal(this.token.balance.toString())
                .mul(new BigDecimal(this.token.price.toString())).toFixedString(4);
            element.valueUSD = (valueUSD === '0.') ? '< 0.0001' : valueUSD;
        }
        return {
            element: element,
            symbol: (this.token.symbol.length > 12) ? this.token.symbol.slice(0, 12).trim() + '...' : this.token.symbol,
        };
    },
};
</script>

<template>
<div v-if="element.balance" class="c-token-list__token-card">
    <q-card >
        <q-card-section class="flex">
            <q-avatar class="q-mr-md">
                <img :src="element.logoURI" :alt="element.name + ' Token Logo'">
            </q-avatar>
            <div class="c-token-list__token-info-container">
                <div class="text-h6 c-token-list__token-name" :title="element.name">
                    <span v-if="element.name.length < 17">{{ element.name }}</span>
                    <span v-else>
                        <span>{{ element.name.slice(0, 17) }}</span>
                        <span>...</span>
                        <q-tooltip>{{ element.name }}</q-tooltip>
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
                        <q-tooltip v-if="fullBalance > balance">
                            {{ element.fullBalance + ' ' + symbol || $t('components.error_fetching_balance') }}
                        </q-tooltip>
                    </div>
                    <div class="text-grey q-mb-sm">
                        <span v-if="element.valueUSD" >{{ element.valueUSD }} $</span>
                        <span v-else>-</span>
                    </div>
                </div>
                <AddToMetamask
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
