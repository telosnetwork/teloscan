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
        <div class="row">
            <div class="col-6 q-pa-md">
                <input v-model="allRequired" type="checkbox" id="allRequired">
                <label for="allRequired">&nbsp;All inputs required?</label>
                <br>

                <input v-model="allDisabled" type="checkbox" id="allDisabled">
                <label for="allDisabled">&nbsp;All inputs disabled?</label>
                <br>

                <input v-model="allReadonly" type="checkbox" id="allReadonly">
                <label for="allReadonly">&nbsp;All inputs readonly?</label>
                <br>
            </div>
        </div>
        <div class="q-pa-md">
            <div class="row">
                <div class="col-3">
                    <base-text-input
                        v-model="baseTextInputValue"
                        v-bind="universalToggles"
                        label="Base Text Input"
                        name="base input"
                    />
                </div>
            </div>

            <div class="row">
                <div class="col-3">
                    <unsigned-int-input
                        v-model="uintInputValue"
                        v-bind="universalToggles"
                        label="Unsigned Integer Input"
                        name="uint input"
                        size="8"
                    />
                </div>
            </div>

            <div class="row">
                <div class="col-3">
                    <signed-int-input
                        v-model="intInputValue"
                        v-bind="universalToggles"
                        label="Signed Integer Input"
                        name="int input"
                        :size="8"
                    />
                </div>
            </div>

            <div class="row">
                <div class="col-3">
                    <address-input
                        v-model="addressInputValue"
                        v-bind="universalToggles"
                        label="Address Input"
                        name="address input"
                        :size="8"
                    />
                </div>
            </div>
        </div>


    </q-card>
</div>
</template>

<script>
import AddressInput from 'components/inputs/AddressInput';
import BaseTextInput from 'components/inputs/BaseTextInput';
import UnsignedIntInput from 'components/inputs/UnsignedIntInput';
import SignedIntInput from 'components/inputs/SignedIntInput';

export default {
    name: 'InputDemo',
    components: {
        AddressInput,
        BaseTextInput,
        SignedIntInput,
        UnsignedIntInput,
    },
    data: () => ({
        allRequired: false,
        allDisabled: false,
        allReadonly: false,
        baseTextInputValue: '',
        uintInputValue: '',
        intInputValue: '',
        addressInputValue: '',
    }),
    computed: {
        universalToggles() {
            return {
                required: this.allRequired,
                disabled: this.allDisabled,
                readonly: this.allReadonly,
            };
        },
    },
}
</script>

<style scoped>

</style>
