<template>
<div class="row">
    <div class="col-12">
        <p class="text-h5 text-white">Inputs</p>
    </div>
    <q-card class="col-12">
        <div class="q-pa-md">
            <div class="row">
                <div class="col-3">
                    <base-text-input
                        v-model="baseTextInputValue"
                        label="Base Text Input"
                        name="base input"
                    />
                </div>
            </div>

            <div class="row">
                <div class="col-3">
                    <unsigned-int-input
                        v-model="uintInputValue"
                        label="Unsigned Integer Input"
                        name="base input"
                        size="8"
                        required="required"
                    />
                </div>
            </div>
        </div>


    </q-card>
</div>
</template>

<script>
import BaseTextInput from 'components/inputs/BaseTextInput';
import UnsignedIntInput from 'components/inputs/UnsignedIntInput';

export default {
    name: 'InputDemo',
    components: {
        UnsignedIntInput,
        BaseTextInput,
    },
    data: () => ({
        baseTextInputValue: '',
        uintInputValue: '',
    }),
}
</script>

<style scoped>

</style>
