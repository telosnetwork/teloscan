<script>
import { integerSizeValidator, parseUintArrayString } from 'components/ContractTab/function-interface-utils';

import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'UnsignedIntArrayInput',
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
        // e.g. a size of 64 produces a type === uint64
        uintSize: {
            type: [Number, String],
            required: true,
            validator: size => integerSizeValidator(size, false),
        },
        // expected size of the uint array
        // if size is undefined or -1, array size is unconstrained; else it is fixed-size (e.g. uint256[3])
        size: {
            type: [Number, String],
            default: -1,
            validator: length => +length >= -1,
        },
    },
    data: () => ({
        placeholder: '[123, 456, ...]',
        previousParsedValue: undefined,
    }),
    computed: {
        expectedArraySize() {
            return +this.size === -1 ? undefined : +this.size;
        },
        rules() {
            const validateParsedArray = value =>
                Array.isArray(parseUintArrayString(value, undefined, +this.uintSize)) || value === '';

            const validateArrayLength = (value) => {
                const sizeIsUnconstrained = [undefined, null, -1, '-1'].includes(this.size);

                if ((sizeIsUnconstrained) || value === '') {
                    return true;
                }

                const expectedLength = +this.size;
                const parsedArrayLength =
                    (parseUintArrayString(value, this.expectedArraySize, +this.uintSize) ?? []).length;

                return parsedArrayLength === expectedLength;
            };

            const incorrectArrayLengthMessage =
                this.$t('components.inputs.incorrect_unsigint_array_length', { size: +this.size });
            const invalidArrayStringMessage = this.$t('components.inputs.invalid_unsigint_array_string');

            return [
                val => validateParsedArray(val) || invalidArrayStringMessage,
                val => validateArrayLength(val) || incorrectArrayLengthMessage,
            ];
        },
        shapedLabel() {
            const size = (Number.isInteger(+this.size) && +this.size !== -1) ? `${+this.size}` : '';
            return `${this.label} (uint${this.uintSize}[${size}])`;
        },
    },
    watch: {
        async size(newVal, oldVal) {
            if (newVal !== oldVal) {
                // addresses size & error message out-of-sync issue
                await this.$refs.input.resetValidation();
                await this.$refs.input.validate();
            }
        },
    },
    methods: {
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);

                const newParsed = parseUintArrayString(newValue, this.expectedArraySize, +this.uintSize);

                if (this.previousParsedValue !== newParsed) {
                    this.$emit('valueParsed', newParsed);
                    this.previousParsedValue = newParsed;
                }
            }
        },
    },
};
</script>

<template>
<BaseTextInput
    ref="input"
    v-bind="$attrs"
    :model-value="modelValue"
    :label="shapedLabel"
    :name="name"
    :placeholder="placeholder"
    :rules="rules"
    :lazy-rules="false"
    :size="undefined"
    :uint-size="undefined"
    @update:modelValue="handleChange"
/>
</template>

<style>

</style>
