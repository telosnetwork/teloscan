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
import { parseUintString } from 'components/ContractTab/function-interface-utils';
import { BigNumber } from 'ethers';

import BaseTextInput from 'components/inputs/BaseTextInput';

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
        // e.g. a size of 64 produces a type === uint64
        size: {
            type: [Number, String],
            required: true,
            validator: size => {
                return Number.isInteger(+size) &&
                       +size % 8 === 0 &&
                       +size <= 256 &&
                       +size >= 0;
            },
        },
    },
    data: () => ({
        previousParsedValue: undefined,
    }),

    computed: {
        rules() {
            const maximum = +this.size === 0 ? '0' : BigNumber.from(2).pow(+this.size).sub(1);

            const errMessageInvalidInput = 'Entry must be a valid unsigned integer';
            const errMessageTooLarge = `Maximum value for uint${this.size} is ${maximum.toString()}`;
            const errMessageNoNegative = `Value for uint${this.size} must not be negative`;

            return [
                val => val[0] !== '-' || errMessageNoNegative,
                val => /^\d*$/.test(val) || errMessageInvalidInput,
                val => BigNumber.from(val || 0).lte(maximum) || errMessageTooLarge,
            ];
        },
        shapedLabel() {
            return `${this.label} (uint${this.size})`
        },
    },
    // eztodo add handler to emit parsed values, see stringarrayinput
    methods: {
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);

                const expectedSize = +this.size === -1 ? undefined : +this.size;
                const newParsed = parseUintString(newValue, expectedSize);

                if (this.previousParsedValue !== newParsed) {
                    this.$emit('valueParsed', newParsed);
                    this.previousParsedValue = newParsed;
                }
            }
        },
    },
}
</script>

<style>

</style>
