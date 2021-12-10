<template>
  <div class="row homeInfo">
    <div class="col q-pa-md">
      <div class="row items-center">
        <div class="col-12 items-center">
          <div class="column items-center text-subtitle2">TLOS Price</div>
        </div>

        <div class="col-12">
          <div class="column items-center text-h6 text-weight-bold">
            $ {{ tlosPrice }}
          </div>
        </div>
      </div>
    </div>

    <div class="col q-pa-md">
      <div class="row items-center">
        <div class="col-12 items-center">
          <div class="column items-center text-subtitle2">Gas Price</div>
        </div>

        <div class="col-12">
          <div class="column items-center text-h6 text-weight-bold">
            {{ gasPriceGwei }} Gwei
          </div>
        </div>
      </div>
    </div>

    <div class="col q-pa-md">
      <div class="row items-center">
        <div class="col-12 items-center">
          <div class="column items-center text-subtitle2">
            Latest Block
          </div>
        </div>

        <div class="col-12">
          <div class="column items-center text-h6 text-weight-bold">
            {{ latestBlock }}
          </div>
        </div>
      </div>
    </div>

    <!-- <div class="col-xs-6 col-md-3 q-pa-md">
      <div class="row items-center">
        <div class="col-12 items-center">
          <div class="column items-center text-subtitle2">Blocks</div>
        </div>

        <div class="col-12">
          <div class="column items-center text-h6 text-weight-bold">
            186,427,544
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { ethers } from "ethers";

export default {
  name: "HomeInfo",
  data() {
    return {
      polling: false
    };
  },
  computed: {
    ...mapGetters("evm", ["tlosPrice", "gasPrice", "latestBlock"]),
    gasPriceGwei() {
      let gweiStr = ethers.utils.formatUnits(this.gasPrice, "gwei");
      gweiStr = (+gweiStr).toFixed(0);
      return gweiStr;
    }
  },
  methods: {
    ...mapActions("evm", ["fetchTlosPrice", "fetchGasPrice", "fetchLatestBlock"]),
  },
  components: {},
  async created() {
    this.fetchTlosPrice();
    this.fetchGasPrice();
    this.fetchLatestBlock();
    // poll every 10 seconds
    this.polling = setInterval(async () => {
      this.fetchTlosPrice();
      this.fetchGasPrice();
      this.fetchLatestBlock();
    }, 3000);
  }
};
</script>

<style lang="scss" scoped></style>
