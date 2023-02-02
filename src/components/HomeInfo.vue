<script>
import { mapGetters, mapActions } from 'vuex';
import { ethers } from 'ethers';
import exchangeImage from 'assets/exchange.png';
import gasImage from 'assets/gas.png';
import blockImage from 'assets/block.png';

export default {
    name: 'HomeInfo',
    data: () => ({
        polling: false,
        gasImage: gasImage,
        exchangeImage: exchangeImage,
        blockImage: blockImage,
    }),
    computed: {
        ...mapGetters('evm', ['tlosPrice', 'gasPrice', 'latestBlock']),
        gasPriceGwei() {
            let gweiStr = ethers.utils.formatUnits(this.gasPrice, 'gwei');
            gweiStr = (+gweiStr).toFixed(0);
            return gweiStr;
        },
    },
    async created() {
        this.fetchTlosPrice();
        this.fetchGasPrice();
        this.fetchLatestBlock();
        this.polling = setInterval(async () => {
            this.fetchTlosPrice();
            this.fetchGasPrice();
            this.fetchLatestBlock();
        }, 3000);
    },
    methods: {
        ...mapActions('evm', ['fetchTlosPrice', 'fetchGasPrice', 'fetchLatestBlock']),
    },
};
</script>

<template>
<div class="row homeInfo">
    <div class="col q-pa-md">
        <div class="row items-center">
            <div class="col-2"></div>
            <div class="col-2"><img :src="exchangeImage" width="40"></div>
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
            <div class="col-2"><img :src="gasImage" width="40"></div>
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
            <div class="col-2"><img :src="blockImage" width="40"></div>
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
