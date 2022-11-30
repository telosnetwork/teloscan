<template>
<base-text-input
    ref="input"
    v-bind="$attrs"
    :model-value="modelValue"
    :label="shapedLabel"
    :name="name"
    :placeholder="placeholder"
    :rules="rules"
    :lazy-rules="false"
    @update:modelValue="handleChange"
/>
</template>

<script>
import { parseSignedIntArrayString } from 'components/ContractTab/function-interface-utils';

import BaseTextInput from 'components/inputs/BaseTextInput';
import { BigNumber } from 'ethers';

export default {
    name: 'SignedIntArrayInput',
    components: {
        BaseTextInput,
    },
    emits: [
        'update:modelValue',
        'valueParsed',
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
        intSize: {
            type: [Number, String],
            required: true,
            validator: size => {
                return Number.isInteger(+size) &&
                    +size % 8 === 0 &&
                    +size <= 128 &&
                    +size >= 0;
            },
        },
        // expected size of the int array
        // if size is undefined or -1, array size is unconstrained; else it is fixed-size (e.g. int256[3])
        size: {
            type: [Number, String],
            default: -1,
            validator: length => +length >= -1,
        },
    },
    data: () => ({
        placeholder: '[123, -456, ...]',
        previousParsedValue: undefined,
    }),
    computed: {
        expectedArraySize() {
            return +this.size === -1 ? undefined : +this.size;
        },
        rules() {
            const maximum = +this.intSize === 0 ? '0' : BigNumber.from(2).pow(+this.intSize).sub(1);
            const minimum = maximum.mul(-1);

            const getIntsFromString = (str) => str.match(/-?\d+/g) ?? [];
            const validateMaximum = (val) => getIntsFromString(val).every(int => BigNumber.from(int).lte(maximum));
            const validateMinimum = (val) => getIntsFromString(val).every(int => BigNumber.from(int).gte(minimum));
            const validateParsedArray = (value) => /^\[(-?\d+, *)*(-?\d+)]$/.test(value) || value === '';
            const validateArrayLength = (value) => {
                const sizeIsUnconstrained = [undefined, null, -1, '-1'].includes(this.size);

                if ((sizeIsUnconstrained) || value === '')
                    return true;

                const expectedLength = +this.size;
                const parsedArrayLength = (parseSignedIntArrayString(value, this.expectedArraySize, +this.intSize) ?? []).length;

                return parsedArrayLength === expectedLength;
            };

            const incorrectArrayLengthMessage = `There should be ${+this.size} signed integers in the array`;
            const invalidArrayStringMessage = 'Entered value does not represent an array of signed integers';
            const errMessageTooLarge = `Maximum value for int${this.intSize} is ${maximum.toString()}`;
            const errMessageTooSmall = `Minimum value for int${this.intSize} is ${minimum.toString()}`;

            return [
                val => validateParsedArray(val) || invalidArrayStringMessage,
                val => validateMaximum(val) || errMessageTooLarge,
                val => validateMinimum(val) || errMessageTooSmall,
                val => validateArrayLength(val) || incorrectArrayLengthMessage,
            ];
        },
        shapedLabel() {
            const size = (Number.isInteger(+this.size) && +this.size !== -1) ? `${+this.size}` : '';
            return `${this.label} (int${this.intSize}[${size}])`
        },
    },
    watch: {
        async size(newVal, oldVal) {
            if (newVal !== oldVal) {
                // addresses size & error message out-of-sync issue
                this.$refs.input.resetValidation();
                await this.$nextTick();
                this.$refs.input.validate();
            }
        },
    },
    methods: {
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);

                const newParsed = parseSignedIntArrayString(newValue, this.expectedArraySize, +this.intSize);

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
