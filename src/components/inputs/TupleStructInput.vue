<script>
import {
    parseTupleString,
    createPlaceholderForTupleInput,
} from 'src/lib/function-interface-utils';
import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'TupleStructInput',
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
        this.placeholder = this.createPlaceholder(this.componentDescription);
        this.hint = this.$t('components.inputs.tuple_struct_input_hint');
    },
    computed: {
        rules() {
            const validateArrayLength = (value) => {
                const sizeIsUnconstrained = [undefined, null, -1, '-1'].includes(this.size);

                if ((sizeIsUnconstrained) || value === '') {
                    return true;
                }

                const abi = this.componentDescription;
                const parsedValue = parseTupleString(value, abi);
                return Array.isArray(parsedValue) && parsedValue.length === abi.length;
            };

            const incorrectArrayLengthMessage =
                this.$t('components.inputs.incorrect_values_array_length', { size: +this.size });

            const validateNoneEntryIsUndefined = (value, innerAbi) => {
                const abi = innerAbi ? innerAbi : this.componentDescription;
                if (value === '') {
                    return true;
                }
                const parsedValue = typeof value === 'string' ? parseTupleString(value, abi) : value;

                for (let i = 0; i < abi.length; i++) {
                    if (parsedValue[i] === undefined) {
                        return false;
                    }
                    if (abi[i].type === 'tuple') {
                        if (!validateNoneEntryIsUndefined(parsedValue[i], abi[i].components)) {
                            return false;
                        }
                    }
                }
                return true;
            };

            const incorrectUndefinedEntryMessage = this.$t('components.inputs.incorrect_undefined_entry');

            return [
                val => validateArrayLength(val) || incorrectArrayLengthMessage,
                val => validateNoneEntryIsUndefined(val) || incorrectUndefinedEntryMessage,
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
        createPlaceholder(componentDescription) {
            return createPlaceholderForTupleInput(componentDescription);
        },
        shapedLabelType(componentDescription) {
            let result = '(';
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
            result += ')';
            return result;
        },
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);

                const expectedSize = +this.size === -1 ? undefined : +this.size;
                console.assert(expectedSize === this.componentDescription.length, { expectedSize, componentDescription: this.componentDescription });
                const newParsed = parseTupleString(newValue, this.componentDescription);

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
