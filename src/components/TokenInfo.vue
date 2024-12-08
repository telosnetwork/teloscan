<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { formatWei } from 'src/antelope/wallets/utils';

const { t: $t } = useI18n();

defineProps({
    contract: {
        type: Object,
        required: true,
    },
});

</script>

<template>
<div>
    <q-card class="c-token">
        <div class="flex">
            <div class="metrics">
                <div class="dataCardsContainer balance">
                    <div
                        v-if="contract.properties?.price
                            && parseFloat(contract.properties.price) > 0"
                        class="dataCardItem"
                    >
                        <div class="dataCardTile">
                            {{ $t('components.usd_price') }}
                        </div>
                        <div class="dataCardData">
                            <span v-if="parseFloat(contract.properties.price) < 0.0001">{{ '< 0.0001 $' }}</span>
                            <span v-else>
                                {{
                                    Number(parseFloat(contract.properties.price))
                                        .toLocaleString('en-US', { minimumFractionDigits: 4 })
                                }} $
                            </span>
                        </div>
                        <q-tooltip> {{ $t('components.price_sources') }}</q-tooltip>
                    </div>
                    <div
                        v-if="contract.properties?.marketcap
                            && parseFloat(contract.properties.marketcap) > 0
                        "
                        class="dataCardItem"
                    >
                        <div class="dataCardTile">
                            {{ $t('components.usd_marketcap') }}
                        </div>
                        <div class="dataCardData">
                            <span v-if="parseFloat(contract.properties.marketcap)< 0.0001">
                                {{ '< 0.0001 $' }}
                            </span>
                            <span v-else>
                                {{ Number(parseFloat(contract.properties.marketcap))
                                    .toLocaleString('en-US', { minimumFractionDigits: 4 })
                                }} $
                            </span>
                        </div>
                        <q-tooltip> {{ $t('components.marketcap_sources') }}</q-tooltip>
                    </div>
                    <div
                        v-if="
                            contract && contract.properties?.supply
                                && (contract.supportedInterfaces?.includes('erc721')
                                    || contract.supportedInterfaces?.includes('erc20'))
                        "
                        class="dataCardItem"
                    >
                        <div
                            v-if="contract.supportedInterfaces?.includes('erc721')"
                            :key="contract.properties.supply + contract.address"
                        >
                            <div class="dataCardTile text-center">
                                {{ $t('pages.minted') }}
                            </div>
                            <div class="dataCardData text-center">
                                <span>
                                    {{ contract.properties.supply }}
                                </span>
                                <q-tooltip>{{ $t('pages.total_nfts_minted') }}</q-tooltip>
                            </div>
                        </div>
                        <div v-else>
                            <div class="dataCardTile text-center">
                                {{ $t('pages.telos_supply') }}
                            </div>
                            <div class="dataCardData text-center">
                                <span>
                                    {{
                                        Number(parseFloat(formatWei(
                                            contract.properties.supply,
                                            contract.properties.decimals
                                        ))).toLocaleString('en-US', { minimumFractionDigits: 4 })
                                    }}
                                </span>
                            </div>
                            <q-tooltip>
                                {{ Number(formatWei(
                                    contract.properties.supply ,
                                    contract.properties.decimals
                                )).toLocaleString('en-US', {
                                    minimumFractionDigits: 4,
                                    maximumFractionDigits: contract.properties?.decimals
                                })}}
                            </q-tooltip>
                        </div>
                    </div>
                    <div
                        v-if="contract && contract.properties?.holders &&
                            (contract.supportedInterfaces?.includes('erc20')
                                || contract.supportedInterfaces?.includes('erc721'))"
                        class="dataCardItem"
                    >
                        <div class="dataCardTile">
                            {{ $t('pages.holders') }}
                        </div>
                        <div class="dataCardData">
                            {{ contract.properties?.holders }}
                        </div>
                        <q-tooltip>{{ $t('pages.evm_holders')  }}</q-tooltip>
                    </div>
                </div>
            </div>
        </div>
    </q-card>
</div>
</template>

<style lang="scss">
.c-token{
    height:100%;
    box-shadow: none;
    margin-top: 12px;
}
</style>
