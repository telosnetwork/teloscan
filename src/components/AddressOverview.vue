<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { WEI_PRECISION, formatWei } from 'src/lib/utils';
import { prettyPrintFiatBalance } from 'src/antelope/wallets/utils';
import TLOS_LOGO from 'assets/logo--tlos.svg';

const $store = useStore();
const { t: $t } = useI18n();

const props = defineProps({
    balance: {
        type: String,
        required: true,
    },
});

const fiatPrice = $store.getters['chain/tlosPrice'];

const tokenQty = ref('0');
const fiatValue = ref(0);

function getBalanceDisplay(quantity: string) {
    return $t('pages.tlos_balance', { balance: quantity });
}

onMounted(() => {
    tokenQty.value = formatWei(props.balance, WEI_PRECISION, 4);
    fiatValue.value = parseFloat(tokenQty.value) * parseFloat(fiatPrice);
});

</script>

<template>
<div>
    <q-card>
        <q-card-section>
            Overview
        </q-card-section>
        <q-card-section>
            <div> TLOS {{ $t('pages.balance') }} </div>
            <div class="c-overview__balance">
                <img :src="TLOS_LOGO" alt="TLOS" height="16">
                {{ getBalanceDisplay(tokenQty) }}
            </div>
        </q-card-section>
        <q-card-section>
            <div> TLOS VALUE </div>
            <div> {{ prettyPrintFiatBalance(fiatValue, 'us', false) }} (@ ${{ fiatPrice }}/TLOS)</div>
        </q-card-section>
    </q-card>
</div>
</template>

<style lang="scss">
.c-overview__balance{
    display: flex;
    img{
        margin-top: 2px;
        margin-right: 2px;
    }
}
</style>
