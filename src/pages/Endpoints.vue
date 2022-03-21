<template lang="pug">
.pageContainer.q-pt-xl
    .homeInfo
        .text-primary.text-h6 RPC ENDPOINTS
    .q-mb-md.tableWrapper
      q-card
        q-item(v-for="endpoint in endpoints" :key="endpoint.endpoint")
          q-item-section.full-width
            q-item-label.text-weight-medium
              span {{ endpoint.name }}
            q-item-label(v-if="endpoint.description" caption) {{ endpoint.description }}
          q-item-section.full-width
            q-item-label.q-mt-sm {{ endpoint.http }}
          q-item-section.full-width
            q-item-label(v-if="endpoint.latency" side top)
              span Latency: {{ endpoint.latency }}ms
              q-icon(name="wifi" :color="getLatencyColor(endpoint.latency)")
            q-item-label(v-if="endpoint.block" side top) Block height: {{ endpoint.block }}
</template>
<script>
import axios from "axios";
import axiosTime from "axios-time";

const ENDPOINT_LIST = 'https://raw.githubusercontent.com/telosnetwork/evm-rpc-list/main/list.json';
const TIMEOUT_MS = 2000;

export default {
  name: "Endpoints",
  data() {
    return {
      endpoints: [],
    };
  },
  mounted() {
   this.checkEndpoints();
  },
  methods: {
    getLatencyColor(latency) {
      if (latency < 375)
        return 'green';

      if (latency < 650)
        return 'yellow';

      return 'red';
    },
    async checkEndpoints() {
      await this.loadEndpoints();
      this.endpoints.forEach((endpoint, idx) => {
        this.doCheck(endpoint, idx);
      })
    },
    async loadEndpoints() {
      const results = await axios.get(ENDPOINT_LIST);
      this.endpoints = results.data;
    },
    async doCheck(endpoint, idx) {
      const checker = axios.create({
        timeout: TIMEOUT_MS
      });

      axiosTime(checker);
      const result = await checker.post(endpoint.http, {
        "jsonrpc":"2.0",
        "method":"eth_blockNumber",
        "params":[],
        "id":1
      });

      this.$set(this.endpoints[idx], 'latency', result.timings.elapsedTime);
      //this.endpoints[idx].latency = result.timings.elapsedTime;
      this.endpoints[idx].block = parseInt(result.data.result, 16);
    }
  }
};
</script>

<style scoped lang='sass'>
.q-list  
  border-radius: 10px
  box-shadow: 0 1px 5px rgb(0 0 0 / 20%), 0 2px 2px rgb(0 0 0 / 14%), 0 3px 1px -2px rgb(0 0 0 / 12%)
.tableWrapper
  min-width: 50vw
  max-width: 100vw
  border-radius: 10px
.text-primary
  margin-left: .25rem
@media only screen and (max-width: 600px)
  .full-width
    min-width: 100%
    margin-top: .25rem
  .no-wrap 
    flex-wrap: wrap
</style>
