<script>
import { parseBytesArrayString } from 'components/ContractTab/function-interface-utils';

import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'BytesArrayInput',
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
        // if size is undefined or -1, array size is unconstrained; else it is fixed-size value type (e.g. bytes3)
        // see https://docs.soliditylang.org/en/latest/types.html#fixed-size-byte-arrays
        size: {
            type: [Number, String],
            default: -1,
            validator: length => (+length >= -1 && +length <= 32) || [undefined, null].includes(length),
        },
    },
    data: () => ({
        placeholder: '[a9, 4b, ff, ...]',
        previousParsedValue: undefined,
    }),
    computed: {
        rules() {
            const validateParsedArray = value => Array.isArray(parseBytesArrayString(value)) || value === '';

            const validateArrayLength = (value) => {
                const sizeIsUnconstrained = [undefined, null, -1, '-1'].includes(this.size);

                if ((sizeIsUnconstrained) || value === '') {
                    return true;
                }

                const expectedLength = +this.size;
                return Array.isArray(parseBytesArrayString(value, expectedLength));
            };

            const incorrectArrayLengthMessage =
                this.$t('components.inputs.incorrect_bytes_array_length', { size: +this.size });
            const invalidArrayStringMessage = this.$t('components.inputs.invalid_bytes_array_string');

            return [
                val => validateParsedArray(val) || invalidArrayStringMessage,
                val => validateArrayLength(val) || incorrectArrayLengthMessage,
            ];
        },
        shapedLabel() {
            let sizeLabel;

            if ([undefined, null, -1, '-1'].includes(this.size)) {
                sizeLabel = '[]';
            } else {
                sizeLabel = `${this.size}`;
            }

            return `${this.label} (bytes${sizeLabel})`;
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

                const expectedSize = +this.size === -1 ? undefined : +this.size;
                const newParsed = parseBytesArrayString(newValue, expectedSize);

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
    @update:modelValue="handleChange"
/>
</template>

<style>

</style>
