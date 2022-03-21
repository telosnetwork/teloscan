<template>
  <div class="pageContainer q-pt-xl">  
    <div class="text-h4 text-primary q-mb-lg">
      Transaction Details
    </div>
    <div class="col-12 q-py-lg">
      <div class="content-container topRounded" v-if="trx">
        <q-tabs
          class="text-white"
          v-model="tab"
          dense
          active-color="secondary"
          align="justify"
          narrow-indicator
        >
          <q-route-tab
            class="topRounded"
            name="general"
            :to="{ hash: '' }"
            exact
            replace
            label="General"
          />
          <q-route-tab
            class="topRounded"
            name="details"
            :to="{ hash: 'details' }"
            exact
            replace
            label="Details"
          />
          <q-route-tab
            class="topRounded"
            name="logs"
            :to="{ hash: 'eventlog' }"
            exact
            replace
            label="Logs"
          />
          <q-route-tab
            class="topRounded"
            name="internal"
            :to="{ hash: 'internal' }"
            exact
            replace
            label="Internal Txns"
          />
        </q-tabs>
        <q-tab-panels
          class="column content-container shadow-2"
          v-model="tab"
          animated
          keep-alive
        >
          <q-tab-panel name="general">
            <div class="col">
              <strong class="wrapStrong">Transaction Hash: </strong>
              <span> {{ hash }}</span>
            </div>
            <br />
            <div>
              <strong>{{ `Block Number: ` }}</strong>
              <block-field :block="trx.block" />
            </div>
            <br />
            <div @click="showAge = !showAge">
              <strong>{{ `Date: ` }} </strong>
              <date-field :epoch="trx.epoch" :show-age="showAge" />
              <q-tooltip> Click to change date format </q-tooltip>
            </div>
            <br />
            <!-- <div>
              <strong> {{ `Transaction index: ` }}</strong>
              <span> {{ trx.trx_index }}</span>
            </div> -->
            <div>
              <strong> {{ `Status: ` }}</strong>
              <span>{{ trx.status == 1 ? "Success" : "Failure" }} </span>
            </div>
            <br />
            <div>
              <strong> {{ `From: ` }}</strong>
              <address-field :address="trx.from" :truncate="0" />
            </div>
            <br />
            <div>
              <strong> {{ `To: ` }}</strong>
              <address-field
                :address="trx.to"
                :truncate="0"
                :is-contract-trx="!!contract"
              />
            </div>
            <br />
            <div v-if="isContract">
              <strong> {{ `Contract function: ` }}</strong>
              <method-field :contract="contract" :trx="methodTrx" />
            </div>
            <br v-if="isContract" />
            <div v-if="isContract">
              <strong> {{ `Contract parameters: ` }}</strong>
              <json-viewer :value="getFunctionParams() " theme="jsonViewer" />
            </div>
            <br v-if="isContract" />
            <div v-if="trx.createdaddr">
              <strong>{{ `Deployed contract: ` }} </strong>
              <span>
                <address-field :address="trx.createdaddr"/>
              </span>
            </div>
            <br />
            <div>
              <strong> {{ `Value: ` }}</strong>
              <span>
                {{ (trx.value / 1000000000000000000).toFixed(5) }} TLOS
              </span>
            </div>
            <br />
            <div>
              <strong> {{ `Gas Price Charged: ` }}</strong>
              <span> {{ getGasChargedGWEI() }} GWEI</span>
            </div>
            <br />
            <div>
              <strong> {{ `Gas Fee: ` }}</strong>
              <span> {{ getGasFee() }} TLOS </span>
            </div>
            <br />
            <div>
              <strong> {{ `Gas Used: ` }}</strong>
              <span> {{ trx.gasused }}</span>
            </div>
            <br />
            <div>
              <strong> {{ `Gas Limit: ` }}</strong>
              <span> {{ trx.gas_limit }}</span>
            </div>
            <br />
            <div>
              <strong> {{ `Nonce: ` }}</strong>
              <span> {{ trx.nonce }}</span>
            </div>
          </q-tab-panel>
          <q-tab-panel name="details">
            <div>
              <strong> {{ `Input: ` }}</strong>
              <span> {{ trx.input_data }}</span>
            </div>
            <br />
            <div>
              <strong> {{ `Output: ` }} </strong>
              <span> {{ trx.output }}</span>
            </div>
          </q-tab-panel>
          <q-tab-panel name="logs">
            <div class="jsonViewer">
              <logs-viewer :logs="getLogs()" />
            </div>
          </q-tab-panel>
          <q-tab-panel name="internal">
            <internal-txns :itxs="trx.itxs" />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </div>
</template>

<script>
import DateField from "components/DateField";
import BlockField from "components/BlockField";
import AddressField from "components/AddressField";
import LogsViewer from "components/Transaction/LogsViewer";
import InternalTxns from "components/Transaction/InternalTxns";
import MethodField from "components/MethodField";
import JsonViewer from "vue-json-viewer";

// TODO: The get_transactions API doesn't format the internal transactions properly, need to fix that before we try to decode them
export default {
  name: "Transaction",
  components: {
    LogsViewer,
    InternalTxns,
    AddressField,
    BlockField,
    DateField,
    MethodField,
    JsonViewer
  },
  data() {
    return {
      hash: this.$route.params.hash,
      blockData: null,
      trxNotFound: false,
      trx: null,
      tab: "general",
      isContract: false,
      contract: null,
      parsedTransaction: null,
      parsedLogs: null,
      methodTrx: null,
      showAge: true
    };
  },
  mounted() {
    this.loadTransaction();
  },
  methods: {
    async loadTransaction() {
      const trxResponse = await this.$evmEndpoint.get(
        `/v2/evm/get_transactions?hash=${this.hash}`
      );
      if (trxResponse.data.transactions.length < 1) {
        this.trxNotFound = true;
        return;
      }

      this.trx = trxResponse.data.transactions[0];
      await this.loadContract();
      this.setTab();
    },
    async loadContract() {
      if (this.trx.input_data === "0x") return;

      const contract = await this.$contractManager.getContract(this.trx.to);
      if (!contract) return;

      this.contract = contract;
      this.parsedTransaction = await this.contract.parseTransaction(
        this.trx.input_data
      );
      this.parsedLogs = await this.contract.parseLogs(this.trx.logs);
      this.methodTrx = Object.assign(
        { parsedTransaction: this.parsedTransaction },
        this.trx
      );
      this.isContract = true;
    },
    setTab() {
      if (this.$route.hash === "internal") {
        this.tab = "internal";
      } else if (this.$route.hash === "eventlog") {
        this.tab = "logs";
      } else if (this.$route.hash === "details") {
        this.tab = "details";
      } else {
        this.tab = "general";
      }
    },
    getFunctionName() {
      if (this.parsedTransaction) return this.parsedTransaction.name;
    },
    getFunctionParams() {
      if (!this.parsedTransaction) return;

      let params = {
        function: this.parsedTransaction.signature,
        args: this.parsedTransaction.args
      };
      return params;
    },
    getLogs() {
      if (this.parsedLogs) {
        const logsObj = this.parsedLogs.map(log => {
          if (log.signature && log.args)
            return { name: log.signature, args: log.args };

          return log;
        });

        return logsObj;
      }

      return this.trx.logs;
    },
    getGasFee() {
      return (
        (this.trx.charged_gas_price * this.trx.gasused) /
        1000000000000000000
      ).toFixed(5);
    },
    getGasChargedGWEI() {
      return (this.trx.charged_gas_price / 1000000000).toFixed(2);
    }
  },
  watch: {
    '$route.params': {
      handler(newValue) {
        const { hash } = newValue
        if (this.hash === hash) {
          return;
        }

        this.hash = hash;
        this.loadTransaction();
      },
      immediate: true,
    }
  }
};
</script>

<style scoped lang="scss">
span {
  word-wrap: break-word;
}
</style>
