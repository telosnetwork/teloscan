<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { BlockData } from 'src/types';
import { EvmTransactionParsed } from 'src/core/types';
import { useI18n } from 'vue-i18n';

const $i18n = useI18n();
const { t: $t } = $i18n;

const props = defineProps({
    trx: {
        type: Object as () => EvmTransactionParsed,
        required: true,
    },
    block: {
        type: Object as () => BlockData,
        required: true,
    },
});

onMounted(async () => {
    await setValues();
});


const limitText = ref('');
const usageText = ref('');

const limitTextTooltips = ref($t('components.gas_limit_tooltip'));
const usageTextTooltips = ref($t('components.gas_used_tooltip'));


const setValues = async () => {
    const limit = props.trx.gasLimitBn;
    const usage = props.trx.gasUsedBn;
    const locale = useI18n().locale.value;

    limitText.value = limit.toNumber().toLocaleString(locale);
    usageText.value = usage.toNumber().toLocaleString(locale) + ` (${((usage.toNumber() / limit.toNumber()) * 100).toFixed(2)}%)`;
};

</script>

<template>
<div
    :class="{
        'c-gas-limit': true,
    }"
>
    <span class="c-gas-limit__limit">
        {{ limitText }}
        <q-tooltip>
            {{ limitTextTooltips }}
        </q-tooltip>
    </span>
    <span> | </span>
    <span class="c-gas-limit__limit">
        {{ usageText }}
        <q-tooltip>
            {{ usageTextTooltips }}
        </q-tooltip>
    </span>
</div>
</template>
