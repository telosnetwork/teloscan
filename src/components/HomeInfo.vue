<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { formatUnits } from 'ethers/lib/utils';


const $store = useStore();
const locale = useI18n().locale.value;

let pollingInterval: null | ReturnType<typeof setInterval> = null;

const tlosPrice = computed(() => $store.getters['chain/tlosPrice']);
const gasPrice = computed(() => $store.getters['chain/gasPrice']);
const latestBlock = computed(() => $store.getters['chain/latestBlock']);
const gasPriceGwei = computed(() => {
    if (!gasPrice.value) {
        return '';
    }
    const gweiStr = formatUnits(gasPrice.value, 'gwei');
    const gweiWholeNumber = Number(Number(gweiStr).toFixed(0));
    return gweiWholeNumber.toLocaleString(locale);
});

onBeforeMount(() => {
    updateFigures();

    pollingInterval = setInterval(() => {
        updateFigures();
    }, 6000);
});

onBeforeUnmount(() => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});

function fetchTlosPrice() {
    $store.dispatch('chain/fetchTlosPrice');
}
function fetchGasPrice() {
    $store.dispatch('chain/fetchGasPrice');
}
function fetchLatestBlock() {
    $store.dispatch('chain/fetchLatestBlock');
}

function updateFigures() {
    fetchTlosPrice();
    fetchGasPrice();
    fetchLatestBlock();
}

</script>

<template>
<div class="row homeInfo">
    <div class="col q-pa-md">
        <div class="row items-center">
            <div class="col-2"></div>
            <div class="col-2">
                <!-- <img :src="exchangeImage" width="40"> -->
            </div>
            <div class="col-8 q-pl-sm">
                <div class="col-12">
                    <div class="column text-subtitle2">{{ $t('components.tlos_price') }}</div>
                </div>
                <div class="col-12">
                    <div class="column text-h6 text-weight-bold">$ {{ tlosPrice }}</div>
                </div>
            </div>
        </div>
    </div>
    <div class="col q-pa-md">
        <div class="row items-center">
            <div class="col-2"></div>
            <div class="col-2">
                <!-- <img :src="gasImage" width="40"> -->
            </div>
            <div class="col-8 q-pl-sm">
                <div class="col-12">
                    <div class="column text-subtitle2">{{ $t('components.gas_price') }}</div>
                </div>
                <div class="col-12">
                    <div class="column text-h6 text-weight-bold">{{ gasPriceGwei }} {{ $t('components.gwei') }}</div>
                </div>
            </div>
        </div>
    </div>
    <div class="col q-pa-md">
        <div class="row items-center">
            <div class="col-2"></div>
            <div class="col-2">
                <!-- <img :src="blockImage" width="40"> -->
            </div>
            <div class="col-8 q-pl-sm">
                <div class="col-12">
                    <div class="column text-subtitle2">{{ $t('components.latest_block') }}</div>
                </div>
                <div class="col-12">
                    <div class="column text-h6 text-weight-bold">{{ latestBlock }}</div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="sass">
.homeInfo
    user-select: none
@media screen and (max-width: 768px)
    .homeInfo
        .col-8
            width: 100% !important
            text-align: center
            padding: 0
        .col-2
            width: 100% !important
            text-align: center
            padding: 0 0 5px 0
            img
                width: auto
                height: 30px
</style>
