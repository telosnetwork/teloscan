<script setup lang="ts">
import { ref } from 'vue';
import { BigNumber } from 'ethers/lib/ethers';

import { GAS_PRECISION, WEI_PRECISION, formatWei } from 'src/lib/utils';

const props = defineProps({
    gasUsed: {
        type: String,
        required: true,
    },
    gasPrice: {
        type: String,
        required: true,
    },
    showTotalGasFee: {
        type: Boolean,
        required: false,
        default: true,
    },
});

const gasWei = ref('');

function totalGasFee() {
    const wei = BigNumber.from(props.gasUsed).mul(props.gasPrice);
    gasWei.value = wei.toString();
    return `${formatWei(wei, WEI_PRECISION, 4)} TLOS`;
}

function gasPriceWei(){
    const wei = BigInt(props.gasPrice);
    return formatWei(wei, GAS_PRECISION, 4);
}

</script>

<template>
<div class="transaction-fee-field-container">
    {{ showTotalGasFee ?  totalGasFee() : gasPriceWei() }}
    <q-tooltip>{{ showTotalGasFee ? $t('components.gas_price_tlos') : $t('components.gas_price_gwei') }}</q-tooltip>
</div>
</template>

<style lang="scss">
.transaction-fee-field-container{
    display: inline-flex;
    align-items: center;
}
</style>
