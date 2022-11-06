<script>
import { mapGetters, mapActions } from 'vuex';
import { ethers } from 'ethers';
import exchangeImage from '../assets/exchange.png';
import gasImage from '../assets/gas.png';
import blockImage from '../assets/block.png';

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

<template lang='pug'>
.row.homeInfo
    .col.q-pa-md
      .row.items-center
        .col-2
        .col-2
            img(:src="exchangeImage" width="40")
        .col-8.q-pl-sm
            .col-12
              .column.text-subtitle2 TLOS Price
            .col-12
              .column.text-h6.text-weight-bold
                | $ {{ tlosPrice }}
    .col.q-pa-md
      .row.items-center
        .col-2
        .col-2
            img(:src="gasImage" width="40")
        .col-8.q-pl-sm
            .col-12
              .column.text-subtitle2 Gas Price
            .col-12
              .column.text-h6.text-weight-bold
                | {{ gasPriceGwei }} Gwei
    .col.q-pa-md
      .row.items-center
        .col-2
        .col-2
            img(:src="blockImage" width="40")
        .col-8.q-pl-sm
            .col-12
              .column.text-subtitle2
                | Latest Block
            .col-12
              .column.text-h6.text-weight-bold
                | {{ latestBlock }}
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
