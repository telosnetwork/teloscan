<template>
<div>
    <q-dialog v-model="enterAmount">
        <q-card class="amount-dialog">
            <p>Select number of decimals and enter an amount, this will be entered for you into the function parameter as uint256</p>
            <q-select
                v-model="selectDecimals"
                :options="decimalOptions"
                @input="updateDecimals"
            />
            <q-input
                v-if="selectDecimals.value === 'custom'"
                v-model.number="customDecimals"
                type="number"
                label="Custom decimals"
                @change="updateDecimals"
            />
            <q-input
                v-model="amountInput"
                label="Amount"
                type="number"
            />
            <q-card-actions align="right">
                <q-btn
                    v-close-popup
                    flat="flat"
                    label="Ok"
                    color="primary"
                    @click="setAmount"
                />
                <q-btn
                    v-close-popup
                    flat="flat"
                    label="Cancel"
                    color="primary"
                    @click="clearAmount"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
    <div v-if="abi.stateMutability === 'payable'">
        <q-input
            v-model="value"
            label="Value (amount)"
        >
            <template #append>
                <q-icon
                    class="cursor-pointer"
                    name="pin"
                    @click="showAmountDialog('value')"
                />
            </template>
        </q-input>
    </div>
    <div
        v-for="(param, idx) in abi.inputs"
        :key="idx"
        :class="{
            'q-mb-md': !!getHintForInput(param.type),
        }"
    >
        <q-input
            v-model="params[idx]"
            :label="makeLabel(param, idx)"
            :placeholder="getHintForInput(param.type)"
        >
            <template v-if="parameterTypeIsUint256(param.type)" #append>
                <q-icon
                    class="cursor-pointer"
                    name="pin"
                    @click="showAmountDialog(idx)"
                />
            </template>
        </q-input>
        <p v-if="!parameterTypeIsImplemented(param.type)" class="q-px-md">
            ⚠️Warning: Implementation of input for type <code>{{ param.type }}</code> is under development; argument
            will be passed as the exact string entered. This may lead to unexpected results if the method is not
            expecting a string.
        </p>

    </div>
    <q-btn
        v-if="enableRun"
        :loading="loading"
        :label="runLabel"
        :disabled="missingInputs"
        class="run-button"
        color="primary"
        icon="send"
        @click="run"
    />
    <p class="text-red output-container">
        {{ errorMessage }}
    </p>
    <div v-if="result" class="output-container">
        Result ({{ abi.outputs && abi.outputs.length > 0 ? abi.outputs[0].type : '' }}): {{ result }}
    </div>
    <div
        v-if="hash"
        class="output-container"
    >
        View Transaction:&nbsp;
        <transaction-field :transaction-hash="hash" />
    </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { Transaction } from '@ethereumjs/tx';

import TransactionField from 'components/TransactionField';

const decimalOptions = [{
    label: '18 - TLOS/ETH/etc..',
    value: 18,
}, {
    label: '9 - Gwei',
    value: 9,
}, {
    label: '8 - BTC',
    value: 8,
}, {
    label: '0 - Wei',
    value: 0,
}, {
    label: 'Custom',
    value: 'custom',
}];

export default {
    name: 'FunctionInterface',
    components: {
        TransactionField,
    },
    props: {
        contract: {
            type: Object,
            default: null,
        },
        abi: {
            type: Object,
            default: null,
        },
        runLabel: {
            type: String,
            default: null,
        },
    },
    data : () => ({
        loading: false,
        errorMessage: '',
        decimalOptions,
        result: null,
        hash: null,
        enterAmount: false,
        amountInput: 0,
        amountParam: null,
        amountDecimals: 0,
        selectDecimals: decimalOptions[0],
        customDecimals: 0,
        value: '0',
        params: [],
        valueParam: {
            'name': 'value',
            'type': 'amount',
            'internalType': 'amount',
        },
    }),
    computed: {
        ...mapGetters('login', [
            'address',
            'isLoggedIn',
            'isNative',
            'nativeAccount',
        ]),
        enableRun() {
            return this.isLoggedIn || this.abi.stateMutability === 'view'
        },
        missingInputs() {
            if (this.abi.inputs.length !== this.params.length) {
                return true;
            }

            for (let i = 0; i < this.abi.inputs.length; i++) {
                if (!this.params[i]) {
                    return true;
                }
            }

            return false;
        },
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
        getHintForInput(type) {
            if (this.parameterTypeIsAddress(type)) {
                return 'e.g. 0x0000000000000000000000000000000000000000';
            } else if (this.parameterTypeIsAddressArray(type)) {
                return 'e.g. [0x0000000000000000000000000000000000000000, 0x1111111111111111111111111111111111111111]';
            } else if (this.parameterTypeIsUint256(type)) {
                return 'e.g. 12345';
            } else if (this.parameterTypeIsUint256Array(type)) {
                return 'e.g. [1234, 5678]';
            } else if (this.parameterTypeIsBoolean(type)) {
                return 'e.g. false';
            } else if (this.parameterTypeIsBooleanArray(type)) {
                return 'e.g. [false, true]';
            }

            return '';
        },


        //eztodo move these to utils file
        parameterTypeIsImplemented(type) {
            return this.parameterTypeIsUint256(type)      ||
                   this.parameterTypeIsUint256Array(type) ||
                   this.parameterTypeIsAddress(type)      ||
                   this.parameterTypeIsAddressArray(type) ||
                   this.parameterTypeIsBoolean(type)      ||
                   this.parameterTypeIsBooleanArray(type);
        },
        parameterTypeIsUint256(type) {
            return type === 'uint256'
        },
        parameterTypeIsUint256Array(type) {
            return /^uint256\[\d*]/.test(type);
        },
        parameterTypeIsAddress(type) {
            return type === 'address';
        },
        parameterTypeIsAddressArray(type) {
            return /^address\[\d*]/.test(type);
        },
        parameterTypeIsBoolean(type) {
            return type === 'bool';
        },
        parameterTypeIsBooleanArray(type) {
            return /^bool\[\d*]/.test(type);
        },
        getExpectedArrayLengthFromParameterType(type) {
            const expectedArrayLengthRegex = /\d+(?=]$)/;
            return (+type.match(expectedArrayLengthRegex)?.[0]) || undefined;
        },
        parseUint256FromString(str = '') {
            const uint256StringRegex = /^\d{1,256}$/;
            const stringRepresentsValidUint256 = uint256StringRegex.test(str);

            if (!stringRepresentsValidUint256) {
                return undefined;
            }

            return BigNumber.from(str);
        },
        parseUint256ArrayString(str = '', expectedLength) {
            if (str === '[]' && expectedLength === undefined)
                return [];

            const arrayOfUint256Regex = /^\[(\d{1,256}, *)*(\d{1,256})]$/;
            const stringRepresentsValidUint256Array = arrayOfUint256Regex.test(str);

            if (!stringRepresentsValidUint256Array)
                return undefined;

            const bigNumberArray = str.match(/\d+/g).map(intString => BigNumber.from(intString))

            if (Number.isInteger(expectedLength)) {
                const actualLength = bigNumberArray.length;

                if (actualLength !== expectedLength)
                    return undefined;
            }

            return bigNumberArray;
        },
        parseAddressString(str) {
            try {
                return ethers.utils.getAddress(str);
            } catch {
                return undefined;
            }
        },
        parseAddressArrayString(str, expectedLength) {
            if (str === '[]' && expectedLength === undefined)
                return [];

            const arrayOfAddressRegex = /^\[((0x[a-zA-Z0-9]{40}, *)*(0x[a-zA-Z0-9]{40}))]$/;
            const stringRepresentsValidAddressArray = arrayOfAddressRegex.test(str);

            if (!stringRepresentsValidAddressArray)
                return undefined;

            let addressArray;

            try {
                const addressStringArray = str.match(/0x[a-zA-Z0-9]{40}/g);
                addressArray = addressStringArray.map(addressString => ethers.utils.getAddress(addressString));
            } catch {
                return undefined;
            }

            if (Number.isInteger(expectedLength)) {
                const actualLength = addressArray.length;

                if (actualLength !== expectedLength)
                    return undefined;
            }

            return addressArray;
        },
        parseBooleanString(str) {
            const trueRegex  = /^true$/i;
            const falseRegex = /^false$/i;

            if (trueRegex.test(str))
                return true;

            if (falseRegex.test(str))
                return false;

            return undefined;
        },
        parseBooleanArrayString(str, expectedLength) {

            const booleanArrayStringRegex = /^\[((true|false), *)*(true|false)]$/i;

            const stringRepresentValidBoolArray = booleanArrayStringRegex.test(str);
            if (!stringRepresentValidBoolArray)
                return undefined;

            const booleanRegex = /true|false/gi;
            const trueRegex = /true/i;
            const boolArray = str.match(booleanRegex).map(bool => trueRegex.test(bool));

            if (Number.isInteger(expectedLength)) {
                const actualLength = boolArray.length;

                if (actualLength !== expectedLength)
                    return undefined;
            }

            return boolArray;
        },


        formatValue(rawValue, type) {
            const value = rawValue.trim();
            const expectedArrayLength = this.getExpectedArrayLengthFromParameterType(type);

            const typeIsUint256      = this.parameterTypeIsUint256(type);
            const typeIsAddress      = this.parameterTypeIsAddress(type);
            const typeIsUint256Array = this.parameterTypeIsUint256Array(type);
            const typeIsAddressArray = this.parameterTypeIsAddressArray(type);
            const typeIsBoolean      = this.parameterTypeIsBoolean(type);
            const typeIsBooleanArray = this.parameterTypeIsBooleanArray(type);

            let parsedValue;

            if (typeIsUint256) {
                parsedValue = this.parseUint256FromString(value);
            } else if (typeIsUint256Array) {
                parsedValue = this.parseUint256ArrayString(value, expectedArrayLength);
            } else if (typeIsAddress) {
                parsedValue = this.parseAddressString(value);
            } else if (typeIsAddressArray) {
                parsedValue = this.parseAddressArrayString(value, expectedArrayLength);
            } else if (typeIsBoolean) {
                parsedValue = this.parseBooleanString(value);
            }  else if (typeIsBooleanArray) {
                parsedValue = this.parseBooleanArrayString(value, expectedArrayLength);
            } else {
                return value; //eztodo should this actually be done? or fail here. is it ever helpful to pass string along to contract fn?
            }

            if (parsedValue === undefined) {
                // eztodo err handling & messaging
                // return something
            }

            return parsedValue;
        },
        async run() {
            this.loading = true;

            try {
                const opts = {};
                if (this.abi.stateMutability === 'payable') {
                    opts.value = this.formatValue(this.value, 'uint256');
                }

                if (this.abi.stateMutability === 'view') {
                    return await this.runRead();
                }

                if (this.isNative) {
                    return await this.runNative(opts);
                }

                return await this.runEVM(opts);
            } catch (e) {
                this.result = e.message;
            }

            this.endLoading();
        },
        getFunctionAbi() {
            return `${this.abi.name}(${this.abi.inputs.map(i => i.type).join(',')})`;
        },
        async getEthersFunction(provider) {
            const contractInstance = await this.contract.getContractInstance(provider);
            return contractInstance[this.getFunctionAbi()];
        },
        runRead() {
            return this.getEthersFunction()
                .then(func => func(...this.getFormattedParams())
                    .then(response => { this.result = response })
                    .catch((msg) => {
                        this.errorMessage = msg;
                    })
                    .finally(() => this.endLoading()),
                );
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
            await user.signTransaction(
                {
                    actions: [{
                        account: 'eosio.evm',
                        name: 'raw',
                        authorization: [
                            {
                                actor: this.nativeAccount,
                                permission: 'active',
                            },
                        ],
                        data: {
                            ram_payer: 'eosio.evm',
                            tx: raw.replace(/^0x/, ''),
                            estimate_gas: false,
                            sender: this.address.replace(/^0x/, '').toLowerCase(),
                        },
                    }],
                },
                {
                    blocksBehind: 3,
                    expireSeconds: 30,
                },
            );

            // This doesn't produce the right hash... but would be nice to use ethers here instead of ethereumjs/tx
            //  maybe just need to have signed transaction with an empty signature?  What is etherumjs/tx doing differently?
            //this.hash = ethers.utils.keccak256(raw);

            const trxBuffer = Buffer.from(raw.replace(/^0x/, ''), 'hex');

            const tx = Transaction.fromSerializedTx(trxBuffer, {
                common: this.$evm.chainConfig,
            });

            this.hash = `0x${tx.hash().toString('hex')}`;
            this.endLoading();
        },
        async runEVM(opts) {
            const func = await this.getEthersFunction(this.$providerManager.getEthersProvider().getSigner());
            const result = await func(...this.getFormattedParams(), opts);
            this.hash = result.hash;
            this.endLoading();
        },
        endLoading() {
            this.loading = false;
        },
    },
}
</script>

<style lang='sass'>
.amount-dialog.q-card
    padding: 1.5rem !important

.output-container
    margin: 0 1rem 1rem 1rem
    font-weight: 500
    font-size: .75rem

.run-button
    margin: 0 1rem 1rem 1rem
    border-radius: .25rem
</style>
