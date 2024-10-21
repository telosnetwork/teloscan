<script lang="ts" setup>
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { prettyPrintFiatBalance } from 'src/antelope/wallets/utils';
import { useChainStore } from 'src/antelope';
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
<div>
    <q-card class="c-overview">
        <q-card-section v-if="!loadingComplete" >
            <q-skeleton type="text" class="c-overview__skeleton" />
        </q-card-section>
        <q-card-section v-else>
            <div class="c-overview__label"> TLOS {{ $t('pages.balance') }} </div>
            <div class="c-overview__balance">
                <img
                    src="branding/telos.png"
                    alt="TLOS"
                    height="18"
                    width="18"
                >
                {{ getBalanceDisplay(props.balance.tokenQty, systemToken.symbol) }}
            </div>
        </q-card-section>
        <q-card-section v-if="!loadingComplete" >
            <q-skeleton type="text" class="c-overview__skeleton" />
        </q-card-section>
        <q-card-section v-else>
            <div class="c-overview__label">
                {{ systemToken.symbol }} {{ $t('pages.value') }}
            </div>
            <div class="c-overview__balance"> {{ prettyPrintFiatBalance(props.balance.fiatValue, 'us', false) }} (@ ${{ fiatPrice }}/{{ systemToken.symbol }})</div>
        </q-card-section>
    </q-card>
</div>
</template>

<style lang="scss">
.c-overview{
    &__balance{
        display: flex;
    }
    &__label{
        font-weight: 600;
        font-size: 0.8rem;
    }
    &__skeleton {
        height: 2rem;

        @media screen and (min-width: $breakpoint-md-min) {
            width: 50%;
        }
    }
    img{
        margin-right: 2px;
    }
}

@-moz-document url-prefix() {
    .c-overview{
        &__label{
            font-weight: 1000;
        }
    }
}
</style>
