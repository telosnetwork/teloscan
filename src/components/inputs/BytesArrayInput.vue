<script>
import BaseTextInput from 'components/inputs/BaseTextInput';

const bytesArrayStringRegex = /^0x([0-9A-Fa-f])*$/;

const validateArrayIsEvenLength = value => value.length % 2 === 0 || value === '';

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
        placeholder: '0xAB12CD...',
        previousParsedValue: undefined,
    }),
    computed: {
        rules() {
            const validateArrayString = value => bytesArrayStringRegex.test(value) || value === '';

            const validateArrayLength = (value) => {
                const sizeIsUnconstrained = [undefined, null, -1, '-1'].includes(this.size);

                if ((sizeIsUnconstrained) || value === '') {
                    return true;
                }

                // the number of bytes, i.e. the number of hex character pairs like 'EF'
                const expectedLength = +this.size;
                const numberOfBytes = (value.length - 2) / 2; // subtract 2 for '0x' prefix

                return numberOfBytes === expectedLength;
            };

            const oddNumberOfBytesMessage = this.$t('components.inputs.odd_number_of_bytes');
            const incorrectArrayLengthMessage =
                this.$t('components.inputs.incorrect_bytes_array_length', { size: +this.size });
            const invalidArrayStringMessage = this.$t('components.inputs.invalid_bytes_array_string');

            return [
                val => validateArrayString(val) || invalidArrayStringMessage,
                val => validateArrayIsEvenLength(val) || oddNumberOfBytesMessage,
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

                const newParsed = newValue || undefined;

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
