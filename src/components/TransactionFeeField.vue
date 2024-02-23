<script setup lang="ts">
import { ref } from 'vue';
import { formatWei } from 'src/lib/utils';

const props = defineProps({
    gasUsed: {
        type: Number,
        required: true,
    },
    gasPrice: {
        type: Number,
        required: true,
    },
    showTotalGasFee: {
        type: Boolean,
        required: false,
        default: true,
    },
});

const gasWei = ref('');

function totalGasFee(){
    const wei = BigInt(props.gasUsed * props.gasPrice);
    gasWei.value = wei.toString();
    return `${formatWei(wei, 18, 3)} TLOS`;
}

function gasPriceWei(){
    const wei = BigInt(props.gasPrice);
    return formatWei(wei, 9, 3);
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
