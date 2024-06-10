<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { WEI_PRECISION, formatWei } from 'src/lib/utils';
import { prettyPrintFiatBalance } from 'src/antelope/wallets/utils';
import { useChainStore } from 'src/antelope';

const $store = useStore();
const { t: $t } = useI18n();

const props = defineProps({
    balance: {
        type: String,
        required: true,
    },
    loadingComplete: {
        type: Boolean,
        required: true,
    },
});

const fiatPrice = $store.getters['chain/tlosPrice'];

const tokenQty = ref('0');
const fiatValue = ref(0);

function getBalanceDisplay(balance: string, symbol: string) {
    return $t('pages.tlos_balance', { balance, symbol });
}

onBeforeMount(() => {
    tokenQty.value = formatWei(props.balance, WEI_PRECISION, 4);
    fiatValue.value = parseFloat(tokenQty.value) * parseFloat(fiatPrice);
});

const systemToken = useChainStore().currentChain.settings.getSystemToken();

</script>

<template>
<div>
    <q-card class="c-overview">
        <q-card-section v-if="!loadingComplete" >
            <q-skeleton type="text" class="c-overview__skeleton" />
        </q-card-section>
        <q-card-section v-else class="c-overview__balance-container">
            <div class="c-overview__label"> {{ systemToken.symbol }} {{ $t('pages.balance') }} </div>
            <div class="c-overview__balance-value">
                <img
                    src="branding/telos.png"
                    :alt="systemToken.symbol"
                    height="18"
                    width="18"
                >
                {{ getBalanceDisplay(tokenQty, systemToken.symbol) }}
                <ValueField
                    :value="tokenQty"
                    :symbol="systemToken.symbol"
                    :decimals="WEI_PRECISION"
                />
            </div>
        </q-card-section>
        <q-card-section v-if="!loadingComplete" >
            <q-skeleton type="text" class="c-overview__skeleton" />
        </q-card-section>
        <q-card-section v-else>
            <div class="c-overview__label">
                {{ systemToken.symbol }} {{ $t('pages.value') }}
            </div>
            <div class="c-overview__balance-value"> {{ prettyPrintFiatBalance(fiatValue, 'us', false) }} (@ ${{ fiatPrice }}/{{ systemToken.symbol }})</div>
        </q-card-section>
    </q-card>
</div>
</template>

<style lang="scss">
.c-overview{
    &__balance-container{
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    &__balance-value {
        display: flex;
        gap: 5px;
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
