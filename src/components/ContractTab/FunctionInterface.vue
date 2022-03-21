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
    div( v-if="hash" ) Transaction hash:&nbsp
      transaction-field( :transaction-hash="hash" )
</template>

<script>
import FunctionParameter from "components/ContractTab/FunctionParameter";
import {mapGetters} from "vuex";
import {BigNumber} from "ethers";
import {ethers} from "ethers";
import {Transaction} from '@ethereumjs/tx';
import TransactionField from "components/TransactionField";

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
  components: {TransactionField, FunctionParameter },
  props: {
    contract: null,
    abi: null
  },
  computed: {
    ...mapGetters('login', [
      'address',
      'isLoggedIn',
      'isNative',
      'nativeAccount'
    ]),
    enableRun() {
      return this.isLoggedIn || this.abi.stateMutability === 'view'
    }
  },
  data() {
    return {
      decimalOptions,
      result: null,
      hash: null,
      enterAmount: false,
      amountInput: 0,
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
          return BigNumber.from(value);
        default:
          return value;
      }
    },
    async run() {
      try {
        const opts = {};
        if (this.abi.payable) {
          opts.value = this.formatValue(this.value, 'uint256');
        }

        if (this.abi.stateMutability === 'view') {
          return this.runRead();
        }

        if (this.isNative) {
          return this.runNative(opts);
        }

        return this.runEVM(opts);
      } catch (e) {
        this.result = e.message;
      }
    },
    getFunctionAbi() {
      return `${this.abi.name}(${this.abi.inputs.map(i => i.type).join(',')})`;
    },
    async getEthersFunction(provider) {
      const contractInstance = await this.contract.getContractInstance(provider);
      return contractInstance[this.getFunctionAbi()];
    },
    async runRead() {
      const func = await this.getEthersFunction();
      this.result = await func(...this.getFormattedParams());
    },
    async runNative(opts) {
      const contractInstance = await this.contract.getContractInstance();
      const func = contractInstance.populateTransaction[this.getFunctionAbi()];
      const gasEstimater = contractInstance.estimateGas[this.getFunctionAbi()];
      const gasLimit = await gasEstimater(...this.getFormattedParams(), Object.assign({from: this.address}, opts));
      const unsignedTrx = await func(...this.getFormattedParams(), opts);
      const nonce = parseInt(await this.$evm.telos.getNonce(this.address), 16);
      const gasPrice = BigNumber.from(`0x${await this.$evm.telos.getGasPrice()}`);
      unsignedTrx.nonce = nonce;
      unsignedTrx.gasLimit = gasLimit;
      unsignedTrx.gasPrice = gasPrice;

      // DO NOT INCLUDE CHAINID, EIP155 is only for replay attacks and you cannot replay a Telos native signed trx
      // this can however break stuff that trys to decode this trx
      //unsignedTrx.chainId = this.$evm.chainId;

      if (opts.value) {
        unsignedTrx.value = opts.value;
      }

      const raw = ethers.utils.serializeTransaction(unsignedTrx);

      let user = this.$providerManager.getProvider();
      const trx = await user.signTransaction(
        {
          actions: [{
            account: "eosio.evm",
            name: "raw",
            authorization: [
              {
                actor: this.nativeAccount,
                permission: "active"
              }
            ],
            data: {
              ram_payer: "eosio.evm",
              tx: raw.replace(/^0x/, ''),
              estimate_gas: false,
              sender: this.address.replace(/^0x/, '').toLowerCase()
            }
          }],
        },
        {
          blocksBehind: 3,
          expireSeconds: 30
        }
      );

      const trxBuffer = Buffer.from(raw.replace(/^0x/, ''), 'hex');

      const tx = Transaction.fromSerializedTx(trxBuffer,  {
        common: this.$evm.chainConfig
      });

      this.hash = `0x${tx.hash().toString('hex')}`;

      // TODO: this isn't right, it calculated 0x38e26d652f172c6d7cbc3b7c09edd6e37ba73926426aa0fc8a5735896be52795
      //  but on chain hash was:               0x77b403e792cb7a454ce19428629b58f1eb9f3a7632ac301df36237dfe1f8e095
      //  likely need to pass something that's not a string, it wants aBytesLike
      //     ethers.utils.keccak256( aBytesLike ) ⇒ string< DataHexString< 32 > >
      //this.hash = ethers.utils.keccak256(raw);
    },
    async runEVM(opts) {
      const func = await this.getEthersFunction(this.$providerManager.getEthersProvider().getSigner());
      const result = await func(...this.getFormattedParams(), opts);
      this.hash = result.hash;
    }
  }
}
</script>

<style scoped>

</style>
