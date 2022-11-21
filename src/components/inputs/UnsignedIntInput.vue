<template>
<base-text-input
    :model-value="modelValue"
    :label="shapedLabel"
    :name="name"
    :maxlength="+size"
    :max="size"
    :min="0"
    :rules="rules"
    type="number"
    @update:modelValue="handleChange"
/>
</template>

<script>
import BaseTextInput from 'components/inputs/BaseTextInput';
// import { BigNumber } from 'ethers';

export default {
    name: 'UnsignedIntInput',
    components: {
        BaseTextInput,
    },
    emits: [
        'update:modelValue',
    ],
    props: {
        modelValue: {
            type: [String, Number],
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        size: {
            type: [Number, String],
            required: true,
            validator: size => {
                return Number.isInteger(+size) &&
                       +size % 8 === 0 &&
                       +size <= 256;
            },
        },
    },
    computed: {
        rules() {
            const errMessageTooLong = `Maximum number of digits for uint${this.size} is ${this.size}`;
            const errMessageNoNegative = `Value for uint${this.size} must not be negative`;
            return [
                val => val.length <= +this.size || errMessageTooLong,
                val => val > 0 || errMessageNoNegative,
            ];
        },
        shapedLabel() {
            return `${this.label} (uint${this.size})`
        },
    },
    methods: {
        handleChange(value) {
            if (value !== this.modelValue) {
                this.$emit('update:modelValue', this.modelValue);
            }
        },
    },
}
</script>

<style>

</style>
