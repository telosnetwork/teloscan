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
                    <input v-model="allRequired" type="checkbox" id="allRequired">
                    <label for="allRequired">&nbsp;All inputs required?</label>
                    <br>

                    <input v-model="allDisabled" type="checkbox" id="allDisabled">
                    <label for="allDisabled">&nbsp;All inputs disabled?</label>
                    <br>

                    <input v-model="allReadonly" type="checkbox" id="allReadonly">
                    <label for="allReadonly">&nbsp;All inputs readonly?</label>
                    <br>

                    <input v-model="allArraysFixedSize" type="checkbox" id="allArraysFixedSize">
                    <label for="allArraysFixedSize">&nbsp;All array inputs have fixed size?</label>
                    <br>
                </div>
            </div>

            <div class="row q-mb-lg">
                <div class="col-12">
                    <p>Vanilla inputs</p>
                </div>
                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <base-text-input
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
                    <string-input
                        v-model="stringInputValue"
                        v-bind="universalToggles"
                        label="String Input"
                        name="string input"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <unsigned-int-input
                        v-model="uintInputValue"
                        v-bind="universalToggles"
                        label="Unsigned Integer Input"
                        name="uint input"
                        size="8"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <signed-int-input
                        v-model="intInputValue"
                        v-bind="universalToggles"
                        label="Signed Integer Input"
                        name="int input"
                        :size="8"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <address-input
                        v-model="addressInputValue"
                        v-bind="universalToggles"
                        label="Address Input"
                        name="address input"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <boolean-input
                        v-model="booleanInputValue"
                        v-bind="universalToggles"
                        label="Boolean Input"
                        name="bool input"
                    />
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <p>Contract interface inputs (Arrays)</p>
                </div>
                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <string-array-input
                        v-model="stringArrayInputValue"
                        v-bind="arrayToggles"
                        label="String Array Input"
                        name="string array input"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <address-array-input
                        v-model="addressArrayInputValue"
                        v-bind="arrayToggles"
                        label="Address Array Input"
                        name="address array input"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <unsigned-int-array-input
                        v-model="uintArrayInputValue"
                        v-bind="arrayToggles"
                        label="Unsigned Int Array Input"
                        name="uint array input"
                        uint-size="8"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <signed-int-array-input
                        v-model="signedIntArrayInputValue"
                        v-bind="arrayToggles"
                        label="Signed Int Array Input"
                        name="int array input"
                        int-size="8"
                    />
                </div>

                <div class="col-xs-12 col-md-6 col-lg-3 col-xl-2">
                    <boolean-array-input
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

<script>
import AddressInput from 'components/inputs/AddressInput';
import AddressArrayInput from 'components/inputs/AddressArrayInput';
import BaseTextInput from 'components/inputs/BaseTextInput';
import BooleanArrayInput from 'components/inputs/BooleanArrayInput';
import BooleanInput from 'components/inputs/BooleanInput';
import SignedIntInput from 'components/inputs/SignedIntInput';
import StringArrayInput from 'components/inputs/StringArrayInput';
import StringInput from 'components/inputs/StringInput';
import UnsignedIntArrayInput from 'components/inputs/UnsignedIntArrayInput';
import UnsignedIntInput from 'components/inputs/UnsignedIntInput';
import SignedIntArrayInput from 'components/inputs/SignedIntArrayInput';

export default {
    name: 'InputDemo',
    components: {
        BooleanArrayInput,
        BooleanInput,
        AddressArrayInput,
        AddressInput,
        BaseTextInput,
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
            }
        },
    },
}
</script>

<style scoped>

</style>
