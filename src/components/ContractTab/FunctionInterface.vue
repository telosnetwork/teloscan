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
} from 'src/lib/function-interface-utils';
import TransactionField from 'src/components/TransactionField.vue';
import LoginModal from 'components/LoginModal.vue';
import FunctionOutputViewer from 'components/ContractTab/FunctionOutputViewer.vue';
import {
    InputComponent,
    OutputType,
    OutputValue,
    inputComponents,
} from 'src/types';
import { getComponentsForAbiInputs } from 'src/lib/function-interface-utils-ts';

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
            missingInputs: true,                          // boolean
            models: {
                inputs: [] as string[],                   // raw input values
                values: [] as EvmFunctionParam[],         // parsed input values
            },

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
        inputComponents(): inputComponents {
            const isRoot = true;
            const components = getComponentsForAbiInputs(this.abi?.inputs, this.models, isRoot) as unknown as inputComponents;
            return components;
        },
        /* missingInputs() { // FIXME: remove
            console.log('FunctionInterface.missingInputs() ...');
            const inputs_length = this.abi.inputs.length;
            const values_length = this.models.values.length;
            if (inputs_length !== values_length) {
                console.log('FunctionInterface.missingInputs()', { inputs_length, values_length }); // FIXME: remove
                return true;
            }

            if (inputs_length !== values_length) {
                return true;
            }

            for (let i = 0; i < this.abi.inputs.length; i++) {
                if (['', null, undefined].includes(this.models.values[i] as never)) {
                    console.log('FunctionInterface.missingInputs()', { i, value: this.models.values[i] }); // FIXME: remove
                    return true;
                }
            }

            console.log('FunctionInterface.missingInputs()', { inputs_length, values_length }); // FIXME: remove
            return false;
        },
        */
    },
    methods: {
        valueParsed(inputType: string, index: number, value: EvmFunctionParam, component: InputComponent) {
            console.log('FunctionInterface.valueParsed()', inputType, index, value); // FIXME: remove
            component.handleValueParsed(inputType, index, value);
            this.updateMissingInputs();
        },
        updateMissingInputs() {
            console.log('FunctionInterface.updateMissingInputs() ...');
            const inputs_length = this.abi.inputs.length;
            const values_length = this.models.values.length;
            if (inputs_length !== values_length) {
                console.log('FunctionInterface.updateMissingInputs()', { inputs_length, values_length }); // FIXME: remove
                this.missingInputs = true;
                return true;
            }

            if (inputs_length !== values_length) {
                this.missingInputs = true;
                return true;
            }

            for (let i = 0; i < this.abi.inputs.length; i++) {
                if (['', null, undefined].includes(this.models.values[i] as never)) {
                    console.log('FunctionInterface.updateMissingInputs()', { i, value: this.models.values[i] }); // FIXME: remove
                    this.missingInputs = true;
                    return true;
                }
            }

            const values = this.models.values;
            console.log('FunctionInterface.updateMissingInputs()', { inputs_length, values_length, values }); // FIXME: remove
            this.missingInputs = false;
            return false;
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
                this.models.values[this.amountParam] = integerAmount as never;
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
                .then(func => func(...this.models.values)
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
            const gasLimit = await gasEstimater(...this.models.values, Object.assign({ from: this.address }, opts));
            const unsignedTrx = await func(...this.models.values, opts);
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
                this.models.values,
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
            class="input-component q-pb-md"
            @valueParsed="valueParsed(component.inputType, index, $event, component)"
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

<style lang="scss">
.text-negative.output-container {
    overflow-wrap: break-word;
    word-break: break-all;
    overflow: hidden;
    white-space: pre-wrap;
}
</style>

