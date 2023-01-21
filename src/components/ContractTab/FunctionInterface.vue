<template>
<div>
    <q-dialog v-model="enterAmount">
        <q-card class="amount-dialog">
            <div class="q-pa-md">
                <p>{{ $t('components.contract_tab.enter_amount') }}</p>
                <q-select
                    v-model="selectDecimals"
                    :options="decimalOptions"
                    @input="updateDecimals"
                />
                <q-input
                    v-if="selectDecimals.value === 'custom'"
                    v-model.number="customDecimals"
                    type="number"
                    :label="$t('components.contract_tab.custom_decimals')"
                    @change="updateDecimals"
                />
                <q-input
                    v-model="amountInput"
                    :label="$t('components.contract_tab.amount')"
                    type="number"
                />
                <q-card-actions align="right">
                    <q-btn
                        v-close-popup
                        flat="flat"
                        :label="$t('global.ok')"
                        color="primary"
                        @click="setAmount"
                    />
                    <q-btn
                        v-close-popup
                        flat="flat"
                        :label="$t('global.cancel')"
                        color="primary"
                        @click="clearAmount"
                    />
                </q-card-actions>
            </div>
        </q-card>
    </q-dialog>
    <div v-if="abi.stateMutability === 'payable'" class="q-pb-md">
        <unsigned-int-input
            v-model="value"
            :label="$t('components.contract_tab.value')"
            name="value"
            size="256"
            required="true"
        >
            <template #append>
                <q-icon
                    class="cursor-pointer"
                    name="pin"
                    @click="showAmountDialog('value')"
                />
            </template>
        </unsigned-int-input>
    </div>

    <template v-for="(component, index) in inputComponents">
        <component
            v-if="component.is"
            :key="index"
            :is="component.is"
            v-bind="component.bindings"
            required="true"
            @valueParsed="component.handleValueParsed(component.inputType, index, $event)"
            @update:modelValue="component.handleModelValueChange(component.inputType, index, $event)"
            class="q-pb-lg"
        />
    </template>

    <q-btn
        v-if="enableRun"
        :loading="loading"
        :label="runLabel"
        :disabled="missingInputs"
        class="run-button q-mb-md"
        color="secondary"
        icon="send"
        @click="run"
    />
    <p class="text-negative output-container">
        {{ errorMessage }}
    </p>
    <div v-if="result" class="output-container">
        {{ $t('components.contract_tab.result') }} ({{ abi.outputs && abi.outputs.length > 0 ? abi.outputs[0].type : '' }}):
        <router-link v-if="abi?.outputs?.[0]?.type === 'address'" :to="`/address/${result}`" >{{ result }}</router-link>
        <template v-else>{{ result }}</template>
    </div>
    <div v-if="hash" class="output-container">
        {{ $t('components.contract_tab.view_transaction') }}
        <transaction-field :transaction-hash="hash" />
    </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { Transaction } from '@ethereumjs/tx';

import {
    asyncInputComponents,
    getComponentForInputType,
    getExpectedArrayLengthFromParameterType,
    getIntegerBits,
    inputIsComplex,
    parameterIsArrayType,
    parameterIsIntegerType,
    parameterTypeIsBoolean,
    parameterTypeIsSignedIntArray,
    parameterTypeIsUnsignedIntArray,
} from 'components/ContractTab/function-interface-utils';

import TransactionField from 'components/TransactionField';


export default {
    name: 'FunctionInterface',
    components: {
        ...asyncInputComponents,
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
    data : () => {
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
            label: '',
            value: 'custom',
        }];

        return {
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
            inputModels: [],
            params: [],
            valueParam: {
                'name': 'value',
                'type': 'amount',
                'internalType': 'amount',
            },
        }
    },
    async created() {
        // initialization of the translated texts
        this.decimalOptions[4].label = this.$t('components.contract_tab.custom');
    },
    computed: {
        ...mapGetters('login', [
            'address',
            'isLoggedIn',
            'isNative',
            'nativeAccount',
        ]),
        inputComponents() {
            if (!Array.isArray(this.abi?.inputs))
                return [];

            const getExtraBindingsForType = ({ type, name }, index) => {
                const label = `${name ? name : `Param ${index + 1}`}`;
                const extras = {};

                // represents integer bits (e.g. uint256) for int types, or array length for array types
                let size = undefined;
                if (parameterIsArrayType(type)) {
                    size = getExpectedArrayLengthFromParameterType(type)
                } else if (parameterIsIntegerType(type)) {
                    size = getIntegerBits(type)
                }

                const getIntSize = () => type.match(/\d+(?=\[)/)[0];

                if (parameterTypeIsUnsignedIntArray(type)) {
                    extras['uint-size'] = getIntSize();
                } else if (parameterTypeIsSignedIntArray(type)) {
                    extras['int-size'] = getIntSize();
                }

                const defaultModelValue = parameterTypeIsBoolean(type) ? null : '';

                return {
                    ...extras,
                    label,
                    size,
                    modelValue: this.inputModels[index] ?? defaultModelValue,
                    name: label.toLowerCase(),
                };
            };

            const handleModelValueChange = (type, index, value) => {
                this.inputModels[index] = value;

                if (!inputIsComplex(type)) {
                    this.params[index] = value;
                }
            };
            const handleValueParsed = (type, index, value) => {
                if (inputIsComplex(type)) {
                    this.params[index] = value;
                }
            };

            return this.abi.inputs.map((input, index) => ({
                bindings: getExtraBindingsForType(input, index),
                is: getComponentForInputType(input.type),
                inputType: input.type,
                handleModelValueChange: (type, index, value) => handleModelValueChange(type, index, value),
                handleValueParsed:      (type, index, value) => handleValueParsed(type, index, value),
            }));
        },
        enableRun() {
            return this.isLoggedIn || this.abi.stateMutability === 'view'
        },
        missingInputs() {
            if (this.abi.inputs.length !== this.params.length) {
                return true;
            }

            for (let i = 0; i < this.abi.inputs.length; i++) {
                if (['', null, undefined].includes(this.params[i])) {
                    return true;
                }
            }

            return false;
        },
    },
    methods: {
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
        async run() {
            this.loading = true;

            try {
                const opts = {};
                if (this.abi.stateMutability === 'payable') {
                    opts.value = this.value;
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
                .then(func => func(...this.params)
                    .then(response => {
                        this.result = response;
                        this.errorMessage = null;
                    })
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
            const gasLimit = await gasEstimater(...this.params, Object.assign({from: this.address}, opts));
            const unsignedTrx = await func(...this.params, opts);
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

            const result = await func(...this.params, opts);
            this.hash = result.hash;
            this.endLoading();
        },
        endLoading() {
            this.loading = false;
        },
    },
}
</script>

<style lang="scss">

</style>
