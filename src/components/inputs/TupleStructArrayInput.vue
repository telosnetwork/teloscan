<script>
import {
    createPlaceholderForTupleArrayInput,
    parseTupleArrayString,
    parseTupleString,
    parseTupleStringWithUnquotedAddresses,
} from 'src/lib/function-interface-utils';

import BaseTextInput from 'components/inputs/BaseTextInput';

// TODO: this is a copy of AddressArrayInput.vue, it needs to be implemented as tuple array input but for now it is a string array input to avoid errors

export default {
    name: 'TupleStructArrayInput',
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
        componentDescription: {
            type: Object,
            required: false,
        },
    },
    data: () => ({
        placeholder: '',
        hint: '',
        previousParsedValue: undefined,
    }),
    async created() {
        // initialization of the translated texts
        this.placeholder = this.createPlaceholder(this.componentDescription, this.size);
        this.hint = this.$t('components.inputs.str_input_hint');
    },
    computed: {
        rules() {
            const validateArrayLength = (value) => {
                const sizeIsUnconstrained = [undefined, null, -1, '-1'].includes(this.size);

                if ((sizeIsUnconstrained) || value === '[]') {
                    return true;
                }
                try {
                    const json = parseTupleStringWithUnquotedAddresses(value);
                    return Array.isArray(json) && json.length === +this.size;
                } catch (e) {
                    return true; // is not a problem of length
                }
            };

            const incorrectArrayLengthMessage =
                this.$t('components.inputs.incorrect_values_array_length', { size: +this.size });

            const validateFormat = (value) => {
                const innerAbi = this.componentDescription;
                try {
                    const json = parseTupleStringWithUnquotedAddresses(value);
                    if (!Array.isArray(json)) {
                        return false;
                    }
                    for (let i = 0; i < json.length; i++) {
                        const parsedValue = parseTupleString(JSON.stringify(json[i]), innerAbi);
                        if (!Array.isArray(parsedValue) || parsedValue.length !== innerAbi.length) {
                            return false;
                        }
                    }
                } catch (e) {
                    return false;
                }
                return true;
            };

            const incorrectFormattedEntryMessage = this.$t('components.inputs.incorrect_values_format');

            return [
                val => validateArrayLength(val) || incorrectArrayLengthMessage,
                val => validateFormat(val) || incorrectFormattedEntryMessage,
            ];
        },
        shapedLabel() {
            let result = `${this.label} ${this.shapedLabelType(this.componentDescription)}`;
            return result;
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
        createPlaceholder(componentDescription, size) {
            return createPlaceholderForTupleArrayInput(componentDescription, size);
        },
        shapedLabelType(componentDescription) {
            let result = '((';
            for (let i = 0; i < +componentDescription.length; i++) {
                if (componentDescription[i].type === 'tuple') {
                    result += `${this.shapedLabelType(componentDescription[i].components)}`;
                } else {
                    result += `${componentDescription[i].type}`;
                }
                if (i < +componentDescription.length - 1) {
                    result += ', ';
                }
            }
            result += ')' + (this.size === -1 ? '[]' : `[${this.size}]`) + ')';
            return result;
        },
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);
                const newParsed = parseTupleArrayString(newValue, this.componentDescription);

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
