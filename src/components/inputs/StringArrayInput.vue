<script>
import { parseStringArrayString } from 'components/ContractTab/function-interface-utils';

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
        // if size is undefined or -1, array size is unconstrained; else it is fixed-size (e.g. string[3])
        size: {
            type: [Number, String],
            default: -1,
            validator: length => +length >= -1,
        },
    },
    data: () => ({
        placeholder: '',
        hint: '',
        previousParsedValue: undefined,
    }),
    async created() {
        // initialization of the translated texts
        this.placeholder = this.$t('components.inputs.str_input_placeholder');
        this.hint = this.$t('components.inputs.str_input_hint');
    },
    computed: {
        rules() {
            const validateParsedArray = value => Array.isArray(parseStringArrayString(value)) || value === '';

            const validateArrayLength = (value) => {
                const sizeIsUnconstrained = [undefined, null, -1, '-1'].includes(this.size);

                if ((sizeIsUnconstrained) || value === '') {
                    return true;
                }

                const expectedLength = +this.size;
                return Array.isArray(parseStringArrayString(value, expectedLength));
            };

            const incorrectArrayLengthMessage =
                this.$t('components.inputs.incorrect_strings_array_length', { size: +this.size });
            const invalidArrayStringMessage = this.$t('components.inputs.invalid_strings_array_string');

            return [
                val => validateParsedArray(val) || invalidArrayStringMessage,
                val => validateArrayLength(val) || incorrectArrayLengthMessage,
            ];
        },
        shapedLabel() {
            const size = (Number.isInteger(+this.size) && +this.size !== -1) ? `${+this.size}` : '';
            return `${this.label} (string[${size}])`;
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
                const newParsed = parseStringArrayString(newValue, expectedSize);

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
    :hint="hint"
    :rules="rules"
    :lazy-rules="false"
    :size="undefined"
    @update:modelValue="handleChange"
/>
</template>

<style>

</style>
