<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { WEI_PRECISION, formatWei } from 'src/lib/utils';
import { prettyPrintFiatBalance } from 'src/antelope/wallets/utils';

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

function getBalanceDisplay(quantity: string) {
    return $t('pages.tlos_balance', { balance: quantity });
}

onBeforeMount(() => {
    tokenQty.value = formatWei(props.balance, WEI_PRECISION, 4);
    fiatValue.value = parseFloat(tokenQty.value) * parseFloat(fiatPrice);
});

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
                {{ getBalanceDisplay(tokenQty) }}
            </div>
        </q-card-section>
        <q-card-section v-if="!loadingComplete" >
            <q-skeleton type="text" class="c-overview__skeleton" />
        </q-card-section>
        <q-card-section v-else>
            <div class="c-overview__label">
                TLOS {{ $t('pages.value') }}
            </div>
            <div class="c-overview__balance"> {{ prettyPrintFiatBalance(fiatValue, 'us', false) }} (@ ${{ fiatPrice }}/TLOS)</div>
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
</style>
