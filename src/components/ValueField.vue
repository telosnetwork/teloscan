<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { WEI_PRECISION } from 'src/antelope/wallets/utils';
import { prettyPrintCurrency } from 'src/antelope/wallets/utils/currency-utils';
import { BigNumber } from 'ethers';

const props = defineProps({
    value: {
        type: [Number, String],
        required: true,
    },
    symbol: {
        type: String,
        required: false,
    },
    decimals: {
        type: [Number, String],
        required: false,
    },
});

const locale = useI18n().locale.value;
function getValueDisplay(value: number | string, symbol: string, decimals: number | string, displayDecimals = 4) {
    console.log('getValueDisplay() entra:', { value, symbol, decimals }); // FIXME: remove this line
    const _decimals = typeof decimals === 'number' ? decimals : parseInt(decimals ?? WEI_PRECISION);
    const _value = typeof value === 'number' ? value.toFixed(_decimals) : value;
    let _final_value = BigNumber.from(0);
    if (typeof _value === 'string' && _value.startsWith('0x')) {
        // if _value starts with 0x, it's a hex value
        _final_value = BigNumber.from(_value);
    } else {
        // if _value has the rofmat xxxxxxxxxxx.yyyyyyyyyyyyyy
        const parts = _value.split('.');
        const decimalsDiff = _decimals - (parts[1]?.length ?? 0);
        if (decimalsDiff > 0) {
            parts[1] = parts[1] ?? '';
            parts[1] += '0'.repeat(decimalsDiff);
        } else if (decimalsDiff < 0) {
            parts[1] = parts[1]?.slice(0, _decimals) ?? '';
        }
        _final_value = BigNumber.from(parts.join(''));
    }
    try {
        const result = prettyPrintCurrency(
            _final_value,
            displayDecimals,
            locale,
            false,
            symbol ?? 'UNKNOWN',
            false,
            _decimals,
            false,
        );
        console.log('getValueDisplay() sale:', { _value, _final_value, symbol, _decimals, result }); // FIXME: remove this line
        return result;
    } catch (e) {
        console.error('getValueDisplay', e);
    }

    return _value;
}


const getTooltipValueDisplay = (value: string| number, symbol: string, decimals: number | string, displayDecimals = 4) => {
    const num = getValueDisplay(value, '', decimals, displayDecimals);
    const withoutZeros = num.trim().replace(/(0+$)/, '')+ ' ' + symbol;
    // modify the previous line to remove the trailing zeros after the first decimal digit
    const withOneDigit = num.trim().replace(/(\.\d[1-9]*)(0+$)/, '$1')+ ' ' + symbol;
    console.log({ num, withoutZeros, withOneDigit });
    return withOneDigit;
};

</script>

<template>
<span class="c-value-field">
    {{ getValueDisplay(props.value, props.symbol ?? '', props.decimals ?? WEI_PRECISION) }}
    <q-tooltip>{{ getTooltipValueDisplay(props.value, props.symbol ?? '', props.decimals ?? WEI_PRECISION, WEI_PRECISION) }}</q-tooltip>
</span>
</template>
<style scoped>
.c-value-field {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
