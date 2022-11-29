<template>
<base-text-input
    ref="input"
    v-bind="$attrs"
    :model-value="modelValue"
    :label="shapedLabel"
    :name="name"
    :placeholder="placeholder"
    :hint="hint"
    :rules="rules"
    :lazy-rules="false"
    @update:modelValue="handleChange"
/>
</template>

<script>
import { parseStringArray } from 'components/ContractTab/function-interface-utils';

import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'StringArrayInput',
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
        size: {
            type: [Number, String],
            default: -1,
            validator: length => +length >= -1,
        },
    },
    data: () => ({
        placeholder: '["some value", ... , "final value"]',
        hint: 'Double quotes within strings must be escaped (\\")',
        previousParsedValue: undefined,
    }),
    computed: {
        rules() {
            const validateParsedArray = (value) => Array.isArray(parseStringArray(value)) || value === '';

            const validateArrayLength = (value) => {
                const sizeIsUnconstrained = [undefined, null, -1, '-1'].includes(this.size);

                if ((sizeIsUnconstrained) || value === '')
                    return true;

                const expectedLength = +this.size;
                const parsedArrayLength = (parseStringArray(value) ?? []).length;

                return parsedArrayLength === expectedLength;
            };

            const incorrectArrayLengthMessage = `There should be ${+this.size} strings in the array`;
            const invalidArrayStringMessage = 'Entered value does not represent an array of strings';

            return [
                val => validateParsedArray(val) || invalidArrayStringMessage,
                val => validateArrayLength(val) || incorrectArrayLengthMessage,
            ];
        },
        shapedLabel() {
            const size = (Number.isInteger(+this.size) && +this.size !== -1) ? `${+this.size}` : '';
            return `${this.label} (string[${size}])`
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

                const newParsed = parseStringArray(newValue);

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
