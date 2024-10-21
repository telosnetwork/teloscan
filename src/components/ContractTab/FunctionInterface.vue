<!-- eslint-disable max-len -->
<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable max-len -->
<script lang="ts">
import { defineComponent, toRaw } from 'vue';
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { Transaction } from '@ethereumjs/tx';
import { LOGIN_DATA_KEY } from 'src/lib/utils';
import { useAccountStore } from 'src/antelope';
import { CURRENT_CONTEXT } from 'src/antelope/wallets';
import { EvmABI, EvmFunctionParam } from 'src/antelope/types';
import { WEI_PRECISION } from 'src/antelope/wallets/utils';
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
    parameterTypeIsTupleStruct,
    parameterTypeIsTupleStructArray,
    parameterTypeIsUnsignedIntArray,
} from 'src/lib/function-interface-utils';
import TransactionField from 'src/components/TransactionField.vue';
import LoginModal from 'components/LoginModal.vue';
import FunctionOutputViewer from 'components/ContractTab/FunctionOutputViewer.vue';
import { OutputType, OutputValue, InputDescription } from 'src/types';

interface Opts {
    value?: string;
}

interface Error {
    message: string;
}

export default defineComponent({
    name: 'FunctionInterface',
    components: {
        ...asyncInputComponents,
        TransactionField,
        LoginModal,
        FunctionOutputViewer,
    },
    props: {
        contract: {
            type: Object,
            default: null,
        },
        abi: {
            type: Object, // EvmABIEntry
            default: null,
        },
        runLabel: {
            type: String,
            default: null,
        },
        write: {
            type: Boolean,
            required: true,
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
            errorMessage: null as string | null,
            decimalOptions,
            result: null as string | null,                // string | null
            response: [] as OutputValue[],                // OutputData[]
            abiOutputs: [] as OutputType[],               // OutputType[]
            hash: null as string | null,                  // string | null
            enterAmount: false,                           // boolean
            amountInput: 0,                               // number
            amountParam: 0 as number | string,            // null ?
            amountDecimals: 0,                            // number
            selectDecimals: decimalOptions[0],
            customDecimals: 0,                            // number
            value: '0',                                   // string
            inputModels: [] as string[],                  // raw input values
            params: [] as EvmFunctionParam[],             // parsed input values
            valueParam: {
                'name': 'value',
                'type': 'amount',
                'internalType': 'amount',
            },
            showLoginModal: false,
        };
    },
    async created() {
        // initialization of the translated texts
        this.decimalOptions[4].label = this.$t('components.contract_tab.custom');
    },
    computed: {
        ...mapGetters('login', [
            'address',
            'isNative',
            'isLoggedIn',
            'nativeAccount',
        ]),
        functionABI(){
            return `${this.abi.name}(${this.abi.inputs.map((i: { type: never; }) => i.type).join(',')})`;
        },
        inputComponents() {
            if (!Array.isArray(this.abi?.inputs)) {
                return [];
            }

            const getExtraBindingsForType = (input: InputDescription, index: number) => {
                const { type, name, components } = input;
                const label = `${name ? name : `Param ${index + 1}`}`;
                const extras = {} as {[key:string]: string | InputDescription[]};

                // represents integer bits (e.g. uint256) for int types, or array length for array types
                let size = undefined;
                if (parameterIsArrayType(type)) {
                    size = getExpectedArrayLengthFromParameterType(type);
                } else if (parameterIsIntegerType(type)) {
                    size = getIntegerBits(type);
                } else if (parameterTypeIsTupleStruct(type) && components) {
                    size = toRaw(components).length;
                }

                const result = type.match(/(\d+)(?=\[)/);
                const intSize = result ? result[0] : undefined;

                if (intSize && parameterTypeIsUnsignedIntArray(type)) {
                    extras['uint-size'] = intSize;
                } else if (intSize && parameterTypeIsSignedIntArray(type)) {
                    extras['int-size'] = intSize;
                } else if (parameterTypeIsTupleStruct(type) && components) {
                    extras['componentDescription'] = toRaw(components);
                } else if (parameterTypeIsTupleStructArray(type) && components) {
                    extras['componentDescription'] = toRaw(components);
                }

                const defaultModelValue = parameterTypeIsBoolean(type) ? null : '';

                const bindings = {
                    ...extras,
                    label,
                    size,
                    modelValue: this.inputModels[index] ?? defaultModelValue,
                    name: label.toLowerCase(),
                };
                return bindings;
            };

            const handleModelValueChange = (type: string, index: number, value: string) => {
                this.inputModels[index] = value;

                if (!inputIsComplex(type)) {
                    this.params[index] = value;
                }
            };
            const handleValueParsed = (type: string, index: number, value: EvmFunctionParam) => {
                if (inputIsComplex(type)) {
                    this.params[index] = value;
                }
            };

            return this.abi.inputs.map((input, index) => ({
                bindings: getExtraBindingsForType(input, index),
                is: getComponentForInputType(input.type),
                inputType: input.type,
                handleModelValueChange: (type: string, index: number, value: string) => handleModelValueChange(type, index, value),
                handleValueParsed:      (type: string, index: number, value: EvmFunctionParam) => handleValueParsed(type, index, value),
            }));
        },
        missingInputs() {
            if (this.abi.inputs.length !== this.params.length) {
                return true;
            }

            for (let i = 0; i < this.abi.inputs.length; i++) {
                if (['', null, undefined].includes(this.params[i] as never)) {
                    return true;
                }
            }

            return false;
        },
    },
    methods: {
        debug() { // FIXME: remove this method
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getExampleValueForType = (input: { type: string; components?: { type: string; components?: any }[] }): string => {
                const type = input.type;

                // Verificar si es un array (tamaño fijo o variable)
                const arrayMatch = type.match(/^(.+)\[(\d*)\]$/);
                if (arrayMatch) {
                    const baseType = arrayMatch[1];
                    const sizeStr = arrayMatch[2]; // Puede ser una cadena vacía para arrays de tamaño variable
                    const size = sizeStr ? parseInt(sizeStr, 10) : 1; // Por defecto, 1 para arrays de tamaño variable

                    // Preparar el input base
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const baseInput = { type: baseType } as { type: string; components?: any };
                    if (input.components) {
                        baseInput.components = input.components;
                    }

                    // Generar el valor de ejemplo para el tipo base
                    const baseValue = getExampleValueForType(baseInput);

                    // Repetir el valor base según el tamaño del array
                    const arrayValues = [];
                    for (let i = 0; i < size; i++) {
                        arrayValues.push(baseValue);
                    }
                    return `[${arrayValues.join(', ')}]`;
                }

                // Manejar los tipos básicos y otros casos
                if (type === 'bool') {
                    return 'false';
                } else if (type === 'address') {
                    return '0xA1F2aDC12cdB069406BFe51f31980324d757317C';
                } else if (type === 'string') {
                    return '"Hello"';
                } else if (type.startsWith('bytes')) {
                    // Manejar tipos bytesN
                    if (type === 'bytes') {
                        return '0x1234567890abcdef';
                    } else if (type === 'bytes32') {
                        return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
                    } else if (type === 'bytes16') {
                        return '0x1234567890abcdef1234567890abcdef';
                    } else if (type === 'bytes8') {
                        return '0x1234567890abcdef';
                    } else if (type === 'bytes4') {
                        return '0x12345678';
                    } else if (type === 'bytes2') {
                        return '0x12';
                    } else if (type === 'bytes1') {
                        return '0x01';
                    }
                } else if (type.startsWith('uint') || type.startsWith('int')) {
                    // Manejar tipos uintN e intN
                    const numMatch = type.match(/^(u?)int(\d*)$/);
                    if (numMatch) {
                        const isUnsigned = numMatch[1] === 'u';
                        if (isUnsigned) {
                            return '123';
                        } else {
                            return '-123';
                        }
                    }
                } else if (type === 'tuple') {
                    const array: string[] = [];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const abi = input.components as { type: string; components?: any }[];
                    abi.forEach((component) => {
                        array.push(getExampleValueForType(component));
                    });
                    return `[${array.join(', ')}]`;
                }

                console.error('Unknown type', type);
                return '...';
            };


            // por daca input en abi, tomamos el type y creamos un valor de ejemplo para ese tipo y lo colocamos en this.params
            this.inputModels = [];
            this.abi.inputs.forEach((input: { type: string, components: {type:string}[] }) => {
                this.inputModels.push(getExampleValueForType(input));
            });

        },
        showAmountDialog(param: string) {
            this.amountParam = param;
            this.amountDecimals = 18;
            this.enterAmount = true;
        },
        updateDecimals() {
            this.amountDecimals = this.selectDecimals.value === 'custom' ?
                +this.customDecimals :
                +this.selectDecimals.value;
        },
        setAmount() {
            const integerAmount = ethers.utils.parseUnits(this.amountInput.toString(), this.amountDecimals).toString();
            if (typeof this.amountParam === 'string') {
                this.value = integerAmount;
            } else {
                this.params[this.amountParam] = integerAmount as never;
            }

            this.clearAmount();
        },
        clearAmount() {
            this.amountInput = 0;
        },
        login() {
            this.showLoginModal = true;
        },
        async run() {
            console.log('run');
            if (!this.isLoggedIn && this.write){
                this.login();
                return;
            }
            this.loading = true;
            this.result = null;
            try {

                if (this.abi.stateMutability === 'view') {
                    return await this.runRead();
                }

                const loginData = localStorage.getItem(LOGIN_DATA_KEY);
                if (!loginData) {
                    console.error('No login data found');
                    this.errorMessage = this.$t('global.internal_error');
                    return;
                }

                const opts: Opts = {};
                if (this.abi.stateMutability === 'payable') {
                    opts.value = this.value;
                }

                if (this.isNative) {
                    return await this.runNative(opts);
                }

                return await this.runEVM(opts);
            } catch (e) {
                console.error(e);
                this.result = (e as Error).message;
            }

            this.endLoading();
        },
        async getEthersFunction(provider?: ethers.providers.JsonRpcSigner | ethers.providers.JsonRpcProvider) {
            const contractInstance = await this.$contractManager.getContractInstance(this.contract, provider);
            return contractInstance[this.functionABI];
        },
        runRead() {
            return this.getEthersFunction()
                .then(func => func(...this.params)
                    .then((response: OutputValue | OutputValue[]) => {
                        this.result = response as unknown as string;
                        this.response = Array.isArray(response) ? response : [response];
                        this.abiOutputs = this.abi.outputs as OutputType[];
                        this.errorMessage = null;
                    })
                    .catch((msg: string) => {
                        this.errorMessage = msg;
                    })
                    .finally(() => this.endLoading()),
                );
        },
        async runNative(opts: Opts) {
            const contractInstance = toRaw(await this.contract.getContractInstance());
            const func = contractInstance.populateTransaction[this.functionABI];
            const gasEstimater = contractInstance.estimateGas[this.functionABI];
            const gasLimit = await gasEstimater(...this.params, Object.assign({ from: this.address }, opts));
            const unsignedTrx = await func(...this.params, opts);
            const nonce = parseInt(await this.$evm.telos.getNonce(this.address), 16);
            const gasPrice = BigNumber.from(`0x${await this.$evm.telos.getGasPrice()}`);
            unsignedTrx.nonce = nonce;
            unsignedTrx.gasLimit = gasLimit;
            unsignedTrx.gasPrice = gasPrice;

            if (opts.value) {
                unsignedTrx.value = opts.value;
            }

            const raw = ethers.utils.serializeTransaction(unsignedTrx);

            let user = this.$providerManager.getProvider() as {
                signTransaction: (tx: never, opts: never) => Promise<void>;
            } | undefined;

            await user?.signTransaction(
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
                } as never,
                {
                    blocksBehind: 3,
                    expireSeconds: 30,
                } as never,
            );

            const trxBuffer = Buffer.from(raw.replace(/^0x/, ''), 'hex');

            const tx = Transaction.fromSerializedTx(trxBuffer, {
                common: this.$evm.chainConfig,
            });

            this.hash = `0x${tx?.hash().toString('hex')}`;
            this.endLoading();
        },
        async runEVM(opts: Opts) {
            const value = opts.value ? BigNumber.from(opts.value) : undefined;

            // Preparing the mesage to show while waiting for confirmation.
            const name = this.abi.name;
            const params = this.abi.inputs.length;
            let keyMsg = 'notification.neutral_message_custom_call';
            let keyErr = 'notification.error_message_custom_call';
            let message = this.$t(keyMsg, { name, params });
            let error = this.$t(keyErr, { name, params });
            if (value) {
                keyMsg = 'notification.neutral_message_custom_call_send';
                keyErr = 'notification.error_message_custom_call_send';
                const quantity = ethers.utils.formatUnits(value, WEI_PRECISION);
                const symbol = 'TLOS';
                message = this.$t(keyMsg, { name, params, quantity, symbol });
                error = this.$t(keyErr, { name, params, quantity, symbol });
            }

            useAccountStore().signCustomTransaction(
                CURRENT_CONTEXT,
                message,
                error,
                this.contract.address,
                [this.abi] as EvmABI,
                this.params,
                value,
            ).then((result) => {
                this.hash = result.hash;
                this.endLoading();
            }).catch((error) => {
                this.result = this.$t(error.message);
                this.endLoading();
            });
        },
        endLoading() {
            this.loading = false;
        },
    },
});
</script>

<template>
<div>
    <LoginModal :show="showLoginModal" @hide="showLoginModal = false" />
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
                        flat
                        :label="$t('global.ok')"
                        @click="setAmount"
                    />
                    <q-btn
                        v-close-popup
                        flat
                        :label="$t('global.cancel')"
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
            :is="component.is"
            v-if="component.is"
            :key="index"
            v-bind="component.bindings"
            required="true"
            class="input-component q-pb-lg"
            @valueParsed="component.handleValueParsed(component.inputType, index, $event)"
            @update:modelValue="component.handleModelValueChange(component.inputType, index, $event)"
        />
    </template>

    <q-btn
        :loading="loading"
        :label="runLabel"
        :disabled="missingInputs"
        class="run-button q-mb-md"
        color="primary"
        icon="send"
        @click="run"
    />
    <!-- FIXME: remove the debug button -->
    <q-btn
        label="DEBUG"
        class="run-button q-mb-md q-ml-md"
        color="primary"
        @click="debug"
    />
    <p class="text-negative output-container">
        {{ errorMessage }}
    </p>
    <div v-if="response.length > 0" class="output-container">

        <FunctionOutputViewer
            :response="response"
            :outputs="abiOutputs"
        />

    </div>
    <div v-if="hash" class="output-container">
        {{ $t('components.contract_tab.view_transaction') }}
        <TransactionField :transaction-hash="hash" />
    </div>
</div>
</template>

<style>
.text-negative.output-container {
    overflow-wrap: break-word;
    word-break: break-all;
    overflow: hidden;
    white-space: pre-wrap;
}
</style>

