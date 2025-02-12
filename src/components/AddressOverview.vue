<script lang="ts" setup>
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { prettyPrintFiatBalance } from 'src/core/wallets/utils';
import { useChainStore } from 'src/core';
import { SystemBalance } from 'src/lib/balance-utils';

const $store = useStore();
const { t: $t } = useI18n();

const props = defineProps({
    balance: {
        type: Object as () => SystemBalance,
        required: true,
    },
    loadingComplete: {
        type: Boolean,
        required: true,
    },
});

const fiatPrice = $store.getters['chain/tlosPrice'];

function getBalanceDisplay(balance: string, symbol: string) {
    return $t('pages.tlos_balance', { balance, symbol });
}

const systemToken = useChainStore().currentChain.settings.getSystemToken();
</script>

<template>
<q-card class="c-address-overview">
    <q-card-section v-if="!loadingComplete" >
        <q-skeleton type="text" class="c-address-overview__skeleton" />
    </q-card-section>
    <q-card-section v-else>
        <div class="c-address-overview__label"> {{ systemToken.symbol }} {{ $t('pages.balance') }} </div>
        <div class="c-address-overview__balance">
            <img
                src="branding/telos.png"
                :alt="systemToken.symbol"
                height="18"
                width="18"
            >
            {{ getBalanceDisplay(props.balance.tokenQty, systemToken.symbol) }}
        </div>
    </q-card-section>
    <q-card-section v-if="!loadingComplete" >
        <q-skeleton type="text" class="c-address-overview__skeleton" />
    </q-card-section>
    <q-card-section v-else>
        <div class="c-address-overview__label">
            {{ systemToken.symbol }} {{ $t('pages.value') }}
        </div>
        <div class="c-address-overview__balance"> {{ prettyPrintFiatBalance(props.balance.fiatValue, 'us', false) }} (@ ${{ fiatPrice }}/{{ systemToken.symbol }})</div>
    </q-card-section>
</q-card>
</template>

<style lang="scss">
.c-address-overview {
    height: 100%;
    &__balance {
        display: flex;
        flex-direction: row;
        gap: 3px;
    }
    &__balance-value {
        display: flex;
        gap: 5px;
    }
    &__label {
        font-weight: 600;
        font-size: 0.8rem;
    }
    &__skeleton {
        height: 2rem;

        @media screen and (min-width: $breakpoint-md-min) {
            width: 50%;
        }
    }
    img {
        margin-right: 2px;
    }
}

@-moz-document url-prefix() {
    .c-address-overview {
        &__label {
            font-weight: 1000;
        }
    }
}
</style>
