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
      gasPrice: "0",
      latestBlock: "0",
      polling: false
    };
  },
  computed: {
    ...mapGetters("general", ["tlosPrice"]),
    gasPriceGwei() {
      let gweiStr = ethers.utils.formatUnits(this.gasPrice, "gwei");
      gweiStr = (+gweiStr).toFixed(0);
      return gweiStr;
    }
  },
  methods: {
    ...mapActions("general", ["fetchTlosPrice"]),
    async fetchGasPrice() {
      this.ethersProvider = new ethers.providers.JsonRpcProvider(
        process.env.NETWORK_EVM_RPC
      );
      this.gasPrice = await this.ethersProvider.getGasPrice();
    },
    async fetchLatestBlock() {
      this.ethersProvider = new ethers.providers.JsonRpcProvider(
        process.env.NETWORK_EVM_RPC
      );
      this.latestBlock = (await this.ethersProvider.getBlock()).number;
    }
  },
  components: {},
  async created() {
    this.fetchTlosPrice();
    await this.fetchGasPrice();
    await this.fetchLatestBlock();
    // poll every 10 seconds
    this.polling = setInterval(async () => {
      this.fetchTlosPrice();
      await this.fetchGasPrice();
      await this.fetchLatestBlock();
    }, 10000);
  }
};
</script>

<style lang="scss" scoped></style>
