<script setup lang="ts">

import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChainStore } from 'src/core';
import HolderList from 'components/Token/HolderList.vue';
import { NativeCurrencyAddress } from 'src/core/types';


interface Properties {
  name: string,
  supply: string,
  symbol: string,
  holders: string,
  decimals: string,
  holders_updated: string,
}

const { t: $t } = useI18n();
const systemToken = computed(() => useChainStore().currentChain.settings.getSystemToken());
const symbol = computed(() => systemToken.value.symbol);
const contract = ref<{address:string, properties:Properties}>(({
    address: NativeCurrencyAddress,
    properties: {
        name: '',
        supply: '1000000000000000000000000000000',
        symbol: symbol.value,
        holders: '0',
        decimals: '18',
        holders_updated: '0',
    },
}));

onMounted(() => {
    useChainStore().currentChain.settings.getTelosApi().get('supply/total').then((res) => {
        contract.value.properties.supply = Number(res.data).toFixed(systemToken.value.decimals).split('.').join('');
    });
    contract.value.properties.name = systemToken.value.name;
    contract.value.properties.symbol = systemToken.value.symbol;
    contract.value.properties.decimals = systemToken.value.decimals.toString();
});

</script>

<template>
<q-page class="c-holders">
    <div class="c-holders__header">
        <span class="c-holders__header-title">{{ $t('components.header.accounts_title', { symbol }) }}</span>
    </div>

    <div class="c-holders__main-container">
        <div class="c-holders__main-content">
            <HolderList
                :contract="contract"
            />
        </div>
    </div>

</q-page>
</template>
<style lang="scss">

.c-holders {
    @include page-container;

    &__header {
        @include page-header;
        &-block-num {
            font-size: 1.5rem;
            margin-left: 10px;
        }
    }
    &__main-container {
        background: transparent !important;
    }
    &__main-content {
        padding: 0px;
        display: flex;
        flex-direction: column;
    }
}

</style>

