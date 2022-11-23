<template>
<base-text-input
    v-bind="$attrs"
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
import { BigNumber } from 'ethers';

import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'SignedIntInput',
    components: {
        BaseTextInput,
    },
    emits: [
        'update:modelValue',
    ],
    props: {
        modelValue: {
            type: String,
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
        // size in bits, in increments of 8 (i.e. bytes): // https://docs.soliditylang.org/en/latest/types.html#integers
        // e.g. a size of 64 produces a type === int64
        size: {
            type: [Number, String],
            required: true,
            validator: size => {
                return Number.isInteger(+size) &&
                       +size % 8 === 0 &&
                       +size <= 128;
            },
        },
    },
    computed: {
        rules() {
            const maximum = +this.size === 0 ? '0' : BigNumber.from(2).pow(+this.size).sub(1);
            const minimum = maximum.mul(-1);

            const errMessageInvalidInput = 'Entry must be a valid signed integer';
            const errMessageTooLarge = `Maximum value for int${this.size} is ${maximum.toString()}`;
            const errMessageTooSmall = `Minimum value for int${this.size} is ${minimum.toString()}`;

            return [
                val => /^-?\d*$/.test(val) || errMessageInvalidInput,
                val => BigNumber.from(val || 0).lte(maximum) || errMessageTooLarge,
                val => BigNumber.from(val || 0).gte(minimum) || errMessageTooSmall,
            ];
        },
        shapedLabel() {
            return `${this.label} (int${this.size})`
        },
    },
    methods: {
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);
            }
        },
    },
}
</script>

<style>

</style>
