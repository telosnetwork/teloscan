<script>
import DateField from 'components/DateField';
import BlockField from 'components/BlockField';
import AddressField from 'components/AddressField';
import LogsViewer from 'components/Transaction/LogsViewer';
import InternalTxns from 'components/Transaction/InternalTxns';
import MethodField from 'components/MethodField';
import JsonViewer from 'vue-json-viewer';
import {formatBN , parseErrorMessage} from 'src/lib/utils';
import { TRANSFER_SIGNATURES } from 'src/lib/functionSignatures';

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
            transfers: [],
            params: [],
            tab: '#general',
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
    async mounted() {
        await this.loadTransaction();
    },
    methods: {
        resetTransaction() {
            this.blockData = null;
            this.trx = null;
            this.tab = '#general';
            this.isContract = false;
            this.contract = null;
            this.parsedTransaction = null;
            this.parsedLogs = null;
            this.methodTrx = null;
            this.transfers = [];
            this.params = [];
        },
        async loadTransaction() {
            const trxResponse = await this.$evmEndpoint.get(
                `/v2/evm/get_transactions?hash=${this.hash}`,
            );
            if (trxResponse.data.transactions.length === 0) {
                this.trxNotFound = true;
                return;
            }

            this.trx = trxResponse.data.transactions[0];
            await this.loadContract();
            await this.loadTransfers();
            this.setErrorMessage();
        },
        async loadTransfers(){
            this.transfers = [];
            this.trx.logs.forEach(log => {
                log.topics.forEach(async (topic) => {
                    if(TRANSFER_SIGNATURES.includes(topic.substr(0, 10))){
                        let contract = await this.$contractManager.getContract(log.address, true);
                        if(typeof contract.token !== 'undefined'){
                            let token = {'symbol': contract.token.symbol, 'address': log.address}
                            let decimals = contract.token.decimals || 18;
                            this.transfers.push({'value' : formatBN(log.data, decimals, 5), 'to' : '0x' + log.topics[2].substr(log.topics[2].length - 40, 40), 'from' : '0x' + log.topics[1].substr(log.topics[1].length - 40, 40), 'token' : token })
                        }
                    }
                });
            });
        },
        async loadContract() {
            if (this.trx.input_data === '0x') return;

            const contract = await this.$contractManager.getContract(this.trx.to);
            if (!contract) return;

            this.contract = contract;
            this.parsedTransaction = await this.contract.parseTransaction(this.trx.input_data);
            this.parsedLogs = await this.contract.parseLogs(this.trx.logs);
            this.params = this.getFunctionParams();
            this.methodTrx = Object.assign(
                { parsedTransaction: this.parsedTransaction },
                this.trx,
            );
            this.isContract = true;
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
            if (!this.parsedTransaction) return [];
            let args = [];
            this.parsedTransaction.functionFragment.inputs.forEach((input, i) => {
                args.push({name: input.name, type: input.type, arrayChildren: (input.arrayChildren !== null) ? input.arrayChildren.type : false, value:  this.parsedTransaction.args[i]})
            })
            return args;
        },
        getLogs() {
            if (this.parsedLogs) {
                return this.parsedLogs.map(log => {
                    if (log.signature && log.args) {
                        return { name: log.signature, function_signature: log.topic.substr(0, 10), args: log.args, inputs: log.eventFragment.inputs, address: log.address  };
                    }
                    return log;
                });
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
          :class="$q.dark.isActive ? 'q-dark' : 'q-light'"
        )
          q-route-tab.topLeftRounded(
            name="general"
            :to="{ hash: '#general' }"
            exact
            replace
            label="General"
          )
          q-route-tab(
            name="details"
            :to="{ hash: '#details' }"
            exact
            replace
            label="Details"
          )
          q-route-tab(
            name="logs"
            :to="{ hash: '#eventlog' }"
            exact
            replace
            label="Logs"
          )
          q-route-tab.topRightRounded(
            name="internal"
            :to="{ hash: '#internal' }"
            exact
            replace
            label="Internal Txns"
          )
        q-tab-panels.column.shadow-2(
          v-model="tab"
          animated
          keep-alive
        )
          q-tab-panel( name="general" :key="isContract" )
            br
            br
            div(class="fit row wrap justify-start items-start content-start")
                div(class="col-3")
                  strong.wrapStrong Transaction Hash:&nbsp;
                div(class="col-9") {{ hash }}
            br
            div(class="fit row wrap justify-start items-start content-start")
                div(class="col-3")
                  strong {{ `Block Number: ` }}
                div(class="col-9")
                  block-field( :block="trx.block" )
            br
            div( @click="showAge = !showAge" class="fit row wrap justify-start items-start content-start date")
                div(class="col-3"  )
                  strong {{ `Date: ` }}
                div.col-9
                  q-icon(class="far fa-clock q-pr-xs q-pb-xs")
                  date-field( :epoch="trx.epoch" :show-age="showAge" style="cursor: pointer;" )
                q-tooltip Click to change date format
            br
            div(class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `Status: ` }}
              div(class="col-9" style="padding: 5px 0px;")
                span(v-if="trx.status == 1", class="positive")
                  q-icon(name='check')
                  span {{ "Success" }}
                span(v-else, class="negative")
                  q-icon(name='warning')
                  span {{ "Failure" }}
            br
            div( v-if="errorMessage", class="fit row wrap justify-start items-start content-start" )
              div(class="col-3")
                strong {{ `Error message: ` }}
              div(class="col-9")
                span.text-negative {{ errorMessage }}
            br( v-if="errorMessage" )
            div(class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `From: ` }}
              div(class="col-9")
                address-field(:address="trx.from" :truncate="0" copy)
            br
            div(class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `To: ` }}
              div(class="col-9")
                address-field( :address="trx.to" :is-contract-trx="!!contract"  :truncate="0" copy)
            br
            div( v-if="isContract", class="fit row wrap justify-start items-start content-start" )
              div(class="col-3")
                strong {{ `Contract function: ` }}
              div(class="col-9")
                MethodField( :contract="contract" :trx="methodTrx" )
            br(v-if="isContract")
            div( v-if="isContract && params.length > 0" class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `Function parameters: ` }}
              div(class="col")
                div(v-for="param in params" class="fit row wrap justify-start items-start content-start")
                  div(class="col-3")
                    q-icon(name="arrow_right" class="list-arrow")
                    span(v-if="param.name") {{ param.name }} ({{param.type}}) :
                    span(v-else) {{param.type}} :
                  div(v-if="param.arrayChildren" class="col-9")
                    div(v-for="(value, index) in param.value")
                      div(v-if="param.arrayChildren === 'tuple'" :class="index != param.value.length - 1 ? 'q-mb-sm' : ''")
                        strong Tuple {{ '#' + index}}
                        div(v-for="(tuple, i) in value") {{ tuple}}
                        br(v-if="index !== param.value.length - 1")
                      div(v-else-if="param.arrayChildren === 'address'") <AddressField :address="value" copy :name="value === contract.address && contract.name ?  contract.name : null"   />
                      div(v-else  ) {{ value }}
                  div(v-else-if="param.type === 'address'" class="col-9") <AddressField :address="param.value" copy :name="param.value === contract.address && contract.name ?  contract.name : null"   />
                  div(v-else  class="col-9") {{ param.value }}
            br( v-if="isContract && params.length > 0" )
            div( v-if="trx.createdaddr", class="fit row wrap justify-start items-start content-start" )
              div(class="col-3")
                strong {{ `Deployed contract: ` }}
              div(class="col-9")
                AddressField( :address="trx.createdaddr" )
            br( v-if="trx.createdaddr" )
            div(class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `Value: ` }}
              div(class="col-9") {{ (trx.value / 1000000000000000000).toFixed(5) }} TLOS
            br
            div(v-if="transfers.length > 0" class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `Tokens transferred: ` }}
              div(class="col-9" id="transfers")
                div(v-for="transfer in transfers" class="fit row wrap justify-start items-start content-start")
                  div(class="col-4")
                    q-icon(name="arrow_right" class="list-arrow")
                    strong {{ `From : ` }}
                    <AddressField :address="transfer.from" :truncate="16" copy :name="transfer.from === contract.address && contract.name ?  contract.name : null" />
                  div(class="col-4")
                    strong {{ ` To : ` }}
                    <AddressField :address="transfer.to" :truncate="16" copy :name="transfer.to === contract.address && contract.name ?  contract.name : null" />
                  div(class="col-4")
                    strong {{ ` Token : ` }}
                    div(class="c-address-field")
                      span {{ transfer.value }}
                      a(:href="'/address/' + transfer.token.address" style="margin-left: 3px;") {{ transfer.token.symbol }}
            br(v-if="transfers.length > 0")
            div(class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `Gas Price Charged: ` }}
              span {{ getGasChargedGWEI() }} GWEI
            br
            div(class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `Gas Fee: ` }}
              span {{ getGasFee() }} TLOS
            br
            div(class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `Gas Used: ` }}
              div(class="col-9") {{ trx.gasused }}
            br
            div(class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `Gas Limit: ` }}
              div(class="col-9") {{ trx.gas_limit }}
            br
            div(class="fit row wrap justify-start items-start content-start")
              div(class="col-3")
                strong {{ `Nonce: ` }}
              div(class="col-9") {{ trx.nonce }}
          q-tab-panel( name="details" )
            div
              div(class="col-3")
                strong {{ `Input: ` }}
              div(class="col-9") {{ trx.input_data }}
            br
            div
              div(class="col-3")
                strong {{ `Output: ` }}
              div(class="col-9") {{ trx.output }}
          q-tab-panel( name="logs" )
            .jsonViewer
              logs-viewer( :logs="getLogs()" :rawLogs="trx.logs" )
          q-tab-panel( name="internal" )
            InternalTxns( :itxs="trx.itxs" )
</template>

<style lang="sass" scoped>
span
    word-wrap: break-word

.col-9 .positive .q-icon, .col-9 .negative .q-icon
    margin-top: -5px
    margin-right: 5px

.date .col-9 > div
    display: inline-block

.list-arrow
    font-size: 1.8em
    margin-top: -3px
    margin-left: -8px
    color: #666666

.col-9 .positive, .col-9 .negative
    border: 1px solid
    border-radius: 5px
    padding: 5px 10px

.col-9 .jv-container .jv-code
    padding: 0

.col-9
    overflow-wrap: break-word

.q-tabs__content
    margin-bottom: -1px

@media (max-width: $breakpoint-sm-max)
    #transfers
        .row
            display: block
            margin-bottom: 10px
            .col-4
              display: block
              width: 100%
        .list-arrow
            display: none
</style>
