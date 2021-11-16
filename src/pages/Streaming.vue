<template>
  <q-page class="column justify-center items-center">
      <div class="text-h4">
          Live Streaming Example
      </div>
      <div style="text-align: center">
        This is the "cpu" action on the "eosmechanics" contract,<br> which benchmarks CPU performance of active BPs
      </div>
      <q-markup-table flat bordered>
        <thead class="background: primary">
          <tr>
            <th class="text-left">Block</th>
            <th class="text-right">Timestamp</th>
            <th class="text-right">Producer</th>
            <th class="text-right">Billed CPU</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="benchmark in benchmarks" :key="benchmark.global_sequence">
            <td class="text-left">{{ benchmark.block_num }}</td>
            <td class="text-right">
              {{
                moment
                  .utc(benchmark['@timestamp'])
                  .local()
                  .format("dddd, MMMM Do YYYY, h:mm:ss a")
              }}
            </td>
            <td class="text-right">{{ benchmark.producer }}</td>
            <td class="text-right">
              {{
                benchmark.cpu_usage_us > 1000
                  ? benchmark.cpu_usage_us / 1000 + " ms"
                  : benchmark.cpu_usage_us + " us"
              }}
            </td>
          </tr>
        </tbody>
      </q-markup-table>
  </q-page>
</template>

<script>
const moment = require("moment");
const HyperionSocketClient = require("@eosrio/hyperion-stream-client").default;
const fetch = require("node-fetch");

export default {
  data() {
    return {
      benchmarks: [],
      client: null,
      moment
    };
  },
  mounted: function() {
    if (this.client) return;

    this.client = new HyperionSocketClient(process.env.HYPERION_ENDPOINT, {
      async: true,
      fetch: fetch
    });

    this.client.onConnect = () => {
      this.client.streamActions({
        contract: "eosmechanics",
        action: "cpu",
        account: "eosmechanics",
        start_from: moment
          .utc()
          .subtract(2, "minutes")
          .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
        read_until: 0,
        filters: []
      });
    };

    this.client.onData = async (data, ack) => {
      this.benchmarks.unshift(data.content);
      console.log(data);
      ack();
    };

    this.client.connect(() => {
      console.log("Connected to Hyperion Stream!");
    });
  },
  destroyed() {
    if (this.client) this.client.disconnect();

    this.client = null;
  }
};
</script>
