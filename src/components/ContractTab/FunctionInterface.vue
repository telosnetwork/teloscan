<template lang="pug">
  div()
    q-dialog( v-model="enterAmount" )
      q-card()
        div() Select number of decimals and enter an amount, this will be entered for you into the function parameter as uint256
        q-select( :options="decimalOptions" v-model="selectDecimals" @input="updateDecimals()")
        q-input( v-if="selectDecimals.value === 'custom'" v-model.number="customDecimals" type="number" label="Custom decimals" @change="updateDecimals()")
        q-input( label="Amount" v-model="amountInput" type="number" )
        q-card-actions( align="right" )
          q-btn( flat label="Ok" color="primary" @click="setAmount" v-close-popup )
          q-btn( flat label="Cancel" color="primary" @click="clearAmount" v-close-popup )
    q-btn( v-if="enableRun" label="Run" icon="send" @click="run()" )
    div( v-if="!enableRun" ) Connect wallet to run
    //function-parameter( v-if="abi.stateMutability === 'payable'" :abi-param="valueParam", :position="0" )
    //function-parameter( v-for="(param, idx) in abi.inputs" :abi-param="param" :position="idx" :key="idx" )
    div( v-if="abi.stateMutability === 'payable'" )
      q-input( label="Value (amount)" v-model="value" )
        template( v-slot:append )
          q-icon( name="pin" @click="showAmountDialog('value')" ).cursor-pointer
    div( v-for="(param, idx) in abi.inputs" :key="idx" )
      q-input( :label="makeLabel(param, idx)" v-model.string="params[idx]" )
        template( v-if="param.type === 'uint256'" v-slot:append )
          q-icon( name="pin" @click="showAmountDialog(idx)" ).cursor-pointer
    div( v-if="result" ) Result ({{ abi.outputs && abi.outputs.length > 0 ? abi.outputs[0].type : '' }}): {{ result }}
</template>

<script>
import FunctionParameter from "components/ContractTab/FunctionParameter";
import {mapGetters} from "vuex";
import {BigNumber} from "ethers";
import {ethers} from "ethers";

const decimalOptions = [
  {
    label: "18 - TLOS/ETH/etc..",
    value: 18
  },
  {
    label: "9 - Gwei",
    value: 9
  },
  {
    label: "8 - BTC",
    value: 8
  },
  {
    label: "0 - Wei",
    value: 0
  },
  {
    label: "Custom",
    value: "custom"
  },
]
export default {
  name: "FunctionInterface",
  components: { FunctionParameter },
  props: {
    contract: null,
    abi: null
  },
  computed: {
    ...mapGetters('login', [
      'isLoggedIn',
      'isNative'
    ]),
    enableRun() {
      return this.isLoggedIn || this.abi.stateMutability === 'view'
    }
  },
  data() {
    return {
      decimalOptions,
      result: null,
      enterAmount: false,
      amountInput: 17,
      amountParam: null,
      amountDecimals: 0,
      selectDecimals: decimalOptions[0],
      customDecimals: 0,
      value: "0",
      params: [],
      valueParam: {
        "name": "value",
        "type": "amount",
        "internalType": "amount"
      }
    }
  },
  methods: {
    makeLabel(abiParam, position) {
      return `${abiParam.name ? abiParam.name : `Param ${position}`} (${abiParam.type})`
    },
    showAmountDialog(param) {
      this.amountParam = param;
      this.amountDecimals = 18;
      this.enterAmount = true;
    },
    updateDecimals() {
      this.amountDecimals = this.selectDecimals.value === 'custom' ? this.customDecimals : this.selectDecimals.value;
    },
    setAmount() {
      const integerAmount = ethers.utils.parseUnits(this.amountInput + '', this.amountDecimals).toString();
      if (this.amountParam === 'value')
        this.value = integerAmount;
      else
        this.params[this.amountParam] = integerAmount;

      this.clearAmount();
    },
    clearAmount() {
      this.amountInput = 0;
    },
    getFormattedParams() {
      const formatted = [];
      for (let i = 0; i < this.abi.inputs.length; i++) {
        let param = this.abi.inputs[i];
        formatted.push(this.formatValue(this.params[i], param.type));
      }
      return formatted;
    },
    formatValue(value, type) {
      switch (type) {
        case 'uint256':
          return BigNumber.from(type);
        default:
          return value;
      }
    },
    async run() {
      try {
        debugger;
        const opts = {};
        if (this.abi.payable) {
          opts.value = this.formatValue(this.value, 'uint256');
        }

        if (this.abi.stateMutability === 'view') {
          const contractInstance = await this.contract.getContractInstance();
          const func = contractInstance[`${this.abi.name}(${this.abi.inputs.map(i => i.type).join(',')})`];
          this.result = await func(...this.getFormattedParams(), opts);
          return;
        }

        const contractInstance = await this.contract.getContractInstance(this.$providerManager.getEthersProvider().getSigner());
        // TODO: if payable and value > 0, add opts with value in it
        // TODO: deal with UAL/native logins here
        const func = contractInstance[`${this.abi.name}(${this.abi.inputs.map(i => i.type).join(',')})`];
        this.result = await func(...this.getFormattedParams(), opts);
      } catch (e) {
        this.result = e.message;
      }
    }
  }
}
</script>

<style scoped>

</style>
