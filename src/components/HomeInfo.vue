<script>
import { mapGetters, mapActions } from "vuex";
import { ethers } from "ethers";

export default {
    name: "HomeInfo",
    data: () => ({
        polling: false
    }),
    computed: {
        ...mapGetters("evm", ["tlosPrice", "gasPrice", "latestBlock"]),
        gasPriceGwei() {
            let gweiStr = ethers.utils.formatUnits(this.gasPrice, "gwei");
            gweiStr = (+gweiStr).toFixed(0);
            return gweiStr;
        }
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
        ...mapActions("evm", ["fetchTlosPrice", "fetchGasPrice", "fetchLatestBlock"]),
    },
};
</script>

<template lang='pug'>
  .row.homeInfo
    .col.q-pa-md
      .row.items-center
        .col-12.items-center
          .column.items-center.text-subtitle2 TLOS Price
        .col-12
          .column.items-center.text-h6.text-weight-bold
            | $ {{ tlosPrice }}
    .col.q-pa-md
      .row.items-center
        .col-12.items-center
          .column.items-center.text-subtitle2 Gas Price
        .col-12
          .column.items-center.text-h6.text-weight-bold
            | {{ gasPriceGwei }} Gwei
    .col.q-pa-md
      .row.items-center
        .col-12.items-center
          .column.items-center.text-subtitle2
            | Latest Block
        .col-12
          .column.items-center.text-h6.text-weight-bold
            | {{ latestBlock }}
</template>
