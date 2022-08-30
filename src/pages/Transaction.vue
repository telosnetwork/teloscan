<script>
import DateField from 'components/DateField';
import BlockField from 'components/BlockField';
import AddressField from 'components/AddressField';
import LogsViewer from 'components/Transaction/LogsViewer';
import InternalTxns from 'components/Transaction/InternalTxns';
import MethodField from 'components/MethodField';
import JsonViewer from 'vue-json-viewer';
import {parseErrorMessage} from 'src/lib/utils';

// TODO: The get_transactions API doesn't format the internal transactions properly, need to fix that before we try to decode them
export default {
    name: 'TransactionPage',
    components: {
        LogsViewer,
        InternalTxns,
        AddressField,
        BlockField,
        DateField,
        MethodField,
        JsonViewer,
    },
    data() {
        return {
            hash: this.$route.params.hash,
            blockData: null,
            trxNotFound: false,
            errorMessage: null,
            trx: null,
            tab: 'general',
            isContract: false,
            contract: null,
            parsedTransaction: null,
            parsedLogs: null,
            methodTrx: null,
            showAge: true,
        };
    },
    watch: {
        '$route.params': {
            handler(newValue) {
                const { hash } = newValue
                if (this.hash === hash) {
                    return;
                }

                this.resetTransaction();
                this.hash = hash;
                this.loadTransaction();
            },
            immediate: true,
        },
    },
    mounted() {
        this.loadTransaction();
    },
    methods: {
        resetTransaction() {
            this.blockData = null;
            this.trx = null;
            this.tab = 'general';
            this.isContract = false;
            this.contract = null;
            this.parsedTransaction = null;
            this.parsedLogs = null;
            this.methodTrx = null;
        },
        async loadTransaction() {
            const trxResponse = await this.$evmEndpoint.get(
                `/v2/evm/get_transactions?hash=${this.hash}`,
            );
            if (trxResponse.data.transactions.length < 1) {
                this.trxNotFound = true;
                return;
            }

            this.trx = trxResponse.data.transactions[0];
            this.setErrorMessage();
            await this.loadContract();
            this.setTab();
        },
        async loadContract() {
            if (this.trx.input_data === '0x') return;

            const contract = await this.$contractManager.getContract(this.trx.to);
            if (!contract) return;

            this.contract = contract;
            this.parsedTransaction = await this.contract.parseTransaction(
                this.trx.input_data,
            );
            this.parsedLogs = await this.contract.parseLogs(this.trx.logs);
            this.methodTrx = Object.assign(
                { parsedTransaction: this.parsedTransaction },
                this.trx,
            );
            this.isContract = true;
        },
        setTab() {
            if (this.$route.hash === 'internal') {
                this.tab = 'internal';
            } else if (this.$route.hash === 'eventlog') {
                this.tab = 'logs';
            } else if (this.$route.hash === 'details') {
                this.tab = 'details';
            } else {
                this.tab = 'general';
            }
        },
        setErrorMessage() {
            if (this.trx.status !== 0)
                return;

            this.errorMessage = parseErrorMessage(this.trx.output);
        },
        getFunctionName() {
            if (this.parsedTransaction) return this.parsedTransaction.name;
        },
        getFunctionParams() {
            if (!this.parsedTransaction) return;

            let params = {
                function: this.parsedTransaction.signature,
                args: this.parsedTransaction.args,
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
        },
    },
};
</script>

<template lang='pug'>
.pageContainer.q-pt-xl
    .row
      .col-12.q-px-md
        .text-h4.text-primary.q-mb-lg
          | Transaction Details
        .text-h6.q-mb-lg.text-white( v-if="trxNotFound" )
          | Not found: {{ hash }}
    .row.tableWrapper
      .col-12.q-py-lg
        .content-container( v-if="trx" )
          q-tabs.text-white.topRounded(
            v-model="tab"
            dense
            active-color="secondary"
            align="justify"
            narrow-indicator
            :class="$q.dark.isActive ? 'q-dark' : 'q-light'"
          )
            q-route-tab.topLeftRounded(
              name="general"
              :to="{ hash: '' }"
              exact
              replace
              label="General"
            )
            q-route-tab(
              name="details"
              :to="{ hash: 'details' }"
              exact
              replace
              label="Details"
            )
            q-route-tab(
              name="logs"
              :to="{ hash: 'eventlog' }"
              exact
              replace
              label="Logs"
            )
            q-route-tab.topRightRounded(
              name="internal"
              :to="{ hash: 'internal' }"
              exact
              replace
              label="Internal Txns"
            )
          q-tab-panels.column.shadow-2(
            v-model="tab"
            animated
            keep-alive
          )
            q-tab-panel( name="general" )
              .col
                strong.wrapStrong Transaction Hash:&nbsp;
                br
                span {{ hash }}
              br
              div
                strong {{ `Block Number: ` }}
                block-field( :block="trx.block" )
              br
              div( @click="showAge = !showAge" )
                strong {{ `Date: ` }}
                date-field( :epoch="trx.epoch" :show-age="showAge" )
                q-tooltip Click to change date format
              br
              div
                strong {{ `Status: ` }}
                span {{ trx.status == 1 ? "Success" : "Failure" }}
              br
              div( v-if="errorMessage" )
                strong {{ `Error message: ` }}
                span.text-red-5 {{ errorMessage }}
              br( v-if="errorMessage" )
              div
                strong {{ `From: ` }}
                address-field(:address="trx.from" :truncate="0")
              br
              div
                strong {{ `To: ` }}
                address-field(
                  :address="trx.to"
                  :truncate="0"
                  :is-contract-trx="!!contract"
                )
              br
              div( v-if="isContract" )
                strong {{ `Contract function: ` }}
                MethodField( :contract="contract" :trx="methodTrx" )
              br(v-if="isContract")
              div( v-if="isContract")
                strong {{ `Contract parameters: ` }}
                json-viewer( :value="getFunctionParams() " theme="jsonViewer" )
              br( v-if="isContract" )
              div( v-if="trx.createdaddr" )
                strong {{ `Deployed contract: ` }}
                span
                  AddressField( :address="trx.createdaddr" )
              br
              div
                strong {{ `Value: ` }}
                span {{ (trx.value / 1000000000000000000).toFixed(5) }} TLOS
              br
              div
                strong {{ `Gas Price Charged: ` }}
                span {{ getGasChargedGWEI() }} GWEI
              br
              div
                strong {{ `Gas Fee: ` }}
                span {{ getGasFee() }} TLOS
              br
              div
                strong {{ `Gas Used: ` }}
                span {{ trx.gasused }}
              br
              div
                strong {{ `Gas Limit: ` }}
                span {{ trx.gas_limit }}
              br
              div
                strong {{ `Nonce: ` }}
                span {{ trx.nonce }}
            q-tab-panel( name="details" )
              div
                strong {{ `Input: ` }}
                span {{ trx.input_data }}
              br
              div
                strong {{ `Output: ` }}
                span {{ trx.output }}
            q-tab-panel( name="logs" )
              .jsonViewer
                logs-viewer( :logs="getLogs()" )
            q-tab-panel( name="internal" )
              InternalTxns( :itxs="trx.itxs" )
</template>

<style scoped lang="sass">
span
  word-wrap: break-word
</style>
