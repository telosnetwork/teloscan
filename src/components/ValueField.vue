<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { WEI_PRECISION } from 'src/antelope/wallets/utils';
import { prettyPrintCurrency } from 'src/antelope/wallets/utils/currency-utils';
import { BigNumber } from 'ethers';
import { useStore } from 'vuex';
import { computed, ref, watch } from 'vue';

const $store = useStore();
const useFixedDecimals = computed(() => $store.state.general.displayDecimals === 'fixed');
const toggleDisplayDecimals = () => $store.dispatch('general/toggleDisplayDecimals');

let big_number = BigNumber.from(0);
let local_decimals = 0;
let local_value = '';

const fixed_decimals = ref('');
const dynamic_decimals = ref('');
const tooltip_decimals = ref('');

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
function updateLocalVariables() {
    local_decimals = typeof props.decimals === 'number' ? props.decimals : +(props.decimals ?? WEI_PRECISION);
    local_value = typeof props.value === 'number' ? props.value.toFixed(local_decimals) : props.value;
    if (typeof local_value === 'string' && local_value.startsWith('0x')) {
        // if local_value starts with 0x, it's a hex value
        big_number = BigNumber.from(local_value);
    } else {

        if (local_value.indexOf('.') === -1) {
            // if local_value has the format xxxxxxxxxxxyyyyyyyyyyyyyy
            local_value = [
                local_value.slice(0, local_value.length - local_decimals), // xxxxxxxxxxx
                local_value.slice(local_value.length - local_decimals),    // yyyyyyyyyyyyyy
            ].join('.'); // -> xxxxxxxxxxx.yyyyyyyyyyyyyy
        }

        // if local_value has the format xxxxxxxxxxx.yyyyyyyyyyyyyy
        const parts = local_value.split('.');
        const decimalsDiff = local_decimals - (parts[1]?.length ?? 0);
        if (decimalsDiff > 0) {
            parts[1] = parts[1] ?? '';
            parts[1] += '0'.repeat(decimalsDiff);
        } else if (decimalsDiff < 0) {
            parts[1] = parts[1]?.slice(0, local_decimals) ?? '';
        }
        big_number = BigNumber.from(parts.join(''));

    }

    try {
        fixed_decimals.value = prettyPrintCurrency(
            big_number,
            4,
            locale,
            false,
            props.symbol ?? '',
            false,
            local_decimals,
            false,
        );
    } catch (e) {
        console.error('getValueDisplay', e);
    }

    try {
        dynamic_decimals.value = prettyPrintCurrency(
            big_number,
            4,
            locale,
            false,
            '',
            false,
            local_decimals,
            false,
        ).trim().replace(/(\.\d[1-9]*)(0+$)/, '$1').replace(/\.0+$/, '') + ' ' + (props.symbol ?? '');
    } catch (e) {
        console.error('getValueDisplay', e);
    }

    try {
        tooltip_decimals.value = prettyPrintCurrency(
            big_number,
            WEI_PRECISION,
            locale,
            false,
            '',
            false,
            local_decimals,
            false,
        ).trim().replace(/(\.\d[1-9]*)(0+$)/, '$1')+ ' ' + (props.symbol ?? '');
    } catch (e) {
        console.error('getValueDisplay', e);
    }

}

watch(() => props.value, () => {
    updateLocalVariables();
}, { immediate: true });

</script>

<template>
<span class="c-value-field" @click="toggleDisplayDecimals()">
    <template v-if="useFixedDecimals">
        {{ fixed_decimals }}
    </template>
    <template v-else>
        {{ dynamic_decimals }}
    </template>
    <q-tooltip>{{ tooltip_decimals }}</q-tooltip>
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
