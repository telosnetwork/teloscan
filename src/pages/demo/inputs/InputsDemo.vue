<script>
import AddressInput from 'components/inputs/AddressInput';
import AddressArrayInput from 'components/inputs/AddressArrayInput';
import BaseTextInput from 'components/inputs/BaseTextInput';
import BooleanArrayInput from 'components/inputs/BooleanArrayInput';
import BooleanInput from 'components/inputs/BooleanInput';
import BytesArrayInput from 'components/inputs/BytesArrayInput';
import SignedIntInput from 'components/inputs/SignedIntInput';
import StringArrayInput from 'components/inputs/StringArrayInput';
import StringInput from 'components/inputs/StringInput';
import UnsignedIntArrayInput from 'components/inputs/UnsignedIntArrayInput';
import UnsignedIntInput from 'components/inputs/UnsignedIntInput';
import SignedIntArrayInput from 'components/inputs/SignedIntArrayInput';

export default {
    name: 'InputDemo',
    components: {
        AddressArrayInput,
        AddressInput,
        BaseTextInput,
        BooleanArrayInput,
        BooleanInput,
        BytesArrayInput,
        SignedIntArrayInput,
        SignedIntInput,
        StringArrayInput,
        StringInput,
        UnsignedIntArrayInput,
        UnsignedIntInput,
    },
    data: () => ({
        allRequired: false,
        allDisabled: false,
        allReadonly: false,
        allArraysFixedSize: undefined,
        baseTextInputValue: '',
        stringInputValue: '',
        uintInputValue: '',
        intInputValue: '',
        addressInputValue: '',
        stringArrayInputValue: '',
        addressArrayInputValue: '',
        uintArrayInputValue: '',
        signedIntArrayInputValue: '',
        booleanInputValue: null,
        boolArrayInputValue: '',
        bytesArrayInputValue: '',
        unconstrainedBytesArrayInputValue: '',
        selectedSignedIntSizeOption: 8,
        selectedUnsignedIntSizeOption: 8,
        signedIntSizeOptions: (() => {
            const arr = [];
            for (let index = 1; index <= 16; index++) {
                arr.push(8*index);
            }
            return arr;
        })(),
        unsignedIntSizeOptions: (() => {
            const arr = [];
            for (let index = 1; index <= 32; index++) {
                arr.push(8*index);
            }
            return arr;
        })(),
    }),
    computed: {
        universalToggles() {
            return {
                required: this.allRequired,
                disabled: this.allDisabled,
                readonly: this.allReadonly,
            };
        },
        arrayToggles() {
            return {
                ...this.universalToggles,
                size: this.allArraysFixedSize ? 3 : -1,
            };
        },
    },
};
</script>

<template>
<div class="row">
    <div class="col-12 text-white">
        <p class="text-h5">Inputs</p>
        <p>
            These inputs wrap <code>QInput</code> components, and all text-based inputs are compatible with
            <a href="https://quasar.dev/vue-components/input" target="_blank" rel="noopener noreferrer">
                quasar props
            </a>
            (other than style props, which are generally fixed)
        </p>
    </div>
    <q-card class="col-12">
        <div class="q-pa-md">
            <div class="row">
                <div class="col-6">
                    <input id="allRequired" v-model="allRequired" type="checkbox">
                    <label for="allRequired">&nbsp;All inputs required?</label>
                    <br>

                    <input id="allDisabled" v-model="allDisabled" type="checkbox">
                    <label for="allDisabled">&nbsp;All inputs disabled?</label>
                    <br>

                    <input id="allReadonly" v-model="allReadonly" type="checkbox">
                    <label for="allReadonly">&nbsp;All inputs readonly?</label>
                    <br>

                    <input id="allArraysFixedSize" v-model="allArraysFixedSize" type="checkbox">
                    <label for="allArraysFixedSize">&nbsp;All array inputs have fixed size?</label>
                    <br>

                    <select id="signedIntSizeOptions" v-model="selectedSignedIntSizeOption">
                        <option
                            v-for="option in signedIntSizeOptions"
                            :key="option"
                            :value="option"
                        >
                            {{ option }}
                        </option>
                    </select>
                    <label for="signedIntSizeOptions">&nbsp;Bits for <code>int</code>-based inputs</label>
                    <br>

                    <select id="unsignedIntSizeOptions" v-model="selectedUnsignedIntSizeOption">
                        <option
                            v-for="option in unsignedIntSizeOptions"
                            :key="option"
                            :value="option"
                        >
                            {{ option }}
                        </option>
                    </select>
                    <label for="allArraysFixedSize">&nbsp;Bits for <code>uint</code>-based inputs</label>
                    <br>
                </div>
            </div>

            <div class="row q-mb-lg">
                <div class="col-12">
                    <p>Vanilla inputs</p>
                </div>
                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <BaseTextInput
                        v-model="baseTextInputValue"
                        v-bind="universalToggles"
                        label="Base Text Input"
                        name="base input"
                    />
                </div>
            </div>
            <div class="row q-mb-lg">
                <div class="col-12">
                    <p>Contract interface inputs</p>
                </div>
                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <StringInput
                        v-model="stringInputValue"
                        v-bind="universalToggles"
                        label="String Input"
                        name="string input"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <UnsignedIntInput
                        v-model="uintInputValue"
                        v-bind="universalToggles"
                        label="Unsigned Integer Input"
                        name="uint input"
                        :size="selectedUnsignedIntSizeOption"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <SignedIntInput
                        v-model="intInputValue"
                        v-bind="universalToggles"
                        label="Signed Integer Input"
                        name="int input"
                        :size="selectedSignedIntSizeOption"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <AddressInput
                        v-model="addressInputValue"
                        v-bind="universalToggles"
                        label="Address Input"
                        name="address input"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <BooleanInput
                        v-model="booleanInputValue"
                        v-bind="universalToggles"
                        label="Boolean Input"
                        name="bool input"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <BytesArrayInput
                        v-model="bytesArrayInputValue"
                        v-bind="universalToggles"
                        label="Bytes Input"
                        name="bytes array input"
                        size="2"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <BytesArrayInput
                        v-model="unconstrainedBytesArrayInputValue"
                        v-bind="universalToggles"
                        label="Byte Array Input"
                        name="unconstrained bytes array input"
                    />
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <p>Contract interface inputs (Arrays)</p>
                </div>
                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <StringArrayInput
                        v-model="stringArrayInputValue"
                        v-bind="arrayToggles"
                        label="String Array Input"
                        name="string array input"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <AddressArrayInput
                        v-model="addressArrayInputValue"
                        v-bind="arrayToggles"
                        label="Address Array Input"
                        name="address array input"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <UnsignedIntArrayInput
                        v-model="uintArrayInputValue"
                        v-bind="arrayToggles"
                        label="Unsigned Int Array Input"
                        name="uint array input"
                        :uint-size="selectedUnsignedIntSizeOption"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <SignedIntArrayInput
                        v-model="signedIntArrayInputValue"
                        v-bind="arrayToggles"
                        label="Signed Int Array Input"
                        name="int array input"
                        :int-size="selectedSignedIntSizeOption"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <BooleanArrayInput
                        v-model="boolArrayInputValue"
                        v-bind="arrayToggles"
                        label="Boolean Array Input"
                        name="bool array input"
                    />
                </div>
            </div>
        </div>
    </q-card>
</div>
</template>

<style scoped>

</style>
