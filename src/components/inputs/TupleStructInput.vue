<script>
import {
    parseStringArrayString,
    parameterIsIntegerType,
    parameterTypeIsAddress,
    parameterTypeIsAddressArray,
    parameterTypeIsBoolean,
    parameterTypeIsBooleanArray,
    parameterTypeIsBytes,
    parameterTypeIsSignedInt,
    parameterTypeIsSignedIntArray,
    parameterTypeIsString,
    parameterTypeIsStringArray,
    parameterTypeIsUnsignedInt,
    parameterTypeIsUnsignedIntArray,
    parameterTypeIsTupleStruct,
    parseTupleString,
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

        console.log('TupleStructInput.created()', { // FIXME: remove this debug log
            placeholder: this.placeholder,
            hint: this.hint,
            modelValue: this.modelValue,
            label: this.label,
            name: this.name,
            size: this.size,
            componentDescription: this.componentDescription,
        });
    },
    computed: {
        rules() {
            const validateArrayLength = (value) => {
                const sizeIsUnconstrained = [undefined, null, -1, '-1'].includes(this.size);
                console.log('TupleStructInput.rules.validateArrayLength()', { // FIXME: remove this debug log
                    value,
                    size: this.size,
                    sizeIsUnconstrained,
                });

                if ((sizeIsUnconstrained) || value === '') {
                    return true;
                }

                const expectedLength = +this.size;
                console.log('TupleStructInput.rules.validateArrayLength()', { // FIXME: remove this debug log
                    expectedLength,
                    value,
                    parsedValue: parseTupleString(value, expectedLength),
                });
                return Array.isArray(parseTupleString(value, expectedLength));
            };

            const incorrectArrayLengthMessage =
                this.$t('components.inputs.incorrect_values_array_length', { size: +this.size });

            return [
                val => validateArrayLength(val) || incorrectArrayLengthMessage,
            ];
        },
        shapedLabel() {
            let result = `${this.label} ${this.shapedLabelType(this.componentDescription)}`;
            console.log('TupleStructInput.shapedLabel()', result); // FIXME: remove this debug log
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
            let placeholder = '[';
            for (let i = 0; i < +componentDescription.length; i++) {
                if (parameterIsIntegerType(componentDescription[i].type)) {
                    placeholder += '-123';
                } else if (parameterTypeIsUnsignedInt(componentDescription[i].type)) {
                    placeholder += '123';
                } else if (parameterTypeIsSignedInt(componentDescription[i].type)) {
                    placeholder += '-123';
                } else if (parameterTypeIsBoolean(componentDescription[i].type)) {
                    placeholder += 'true';
                } else if (parameterTypeIsString(componentDescription[i].type)) {
                    placeholder += '"abc"';
                } else if (parameterTypeIsAddress(componentDescription[i].type)) {
                    placeholder += '0x123...7890';
                } else if (parameterTypeIsBytes(componentDescription[i].type)) {
                    placeholder += '0x123...234';
                } else if (parameterTypeIsBooleanArray(componentDescription[i].type)) {
                    placeholder += '[true, false]';
                } else if (parameterTypeIsStringArray(componentDescription[i].type)) {
                    placeholder += '["abc", "def"]';
                } else if (parameterTypeIsAddressArray(componentDescription[i].type)) {
                    placeholder += '[0x123...7890, 0x123...7890]';
                } else if (parameterTypeIsUnsignedIntArray(componentDescription[i].type)) {
                    placeholder += '[123, 456]';
                } else if (parameterTypeIsSignedIntArray(componentDescription[i].type)) {
                    placeholder += '[-123, -456]';
                } else if (parameterTypeIsTupleStruct(componentDescription[i].type)) {
                    placeholder += this.createPlaceholder(componentDescription[i].components);
                }

                if (i < +componentDescription.length - 1) {
                    placeholder += ', ';
                }
            }
            placeholder += ']';
            return placeholder;
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
                console.log('TupleStructInput.handleChange()', this.modelValue, '-->', newValue); // FIXME: remove this debug log
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
