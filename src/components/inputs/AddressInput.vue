<template>
<base-text-input
    v-bind="$attrs"
    :model-value="modelValue"
    :label="shapedLabel"
    :name="name"
    :maxlength="42"
    :rules="rules"
    autocomplete="new-password"
    placeholder="Address beginning with 0x"
    @update:modelValue="handleChange"
/>
</template>

<script>
import { parseAddressString } from 'components/ContractTab/function-interface-utils';

import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'AddressInput',
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
    },
    computed: {
        rules() {
            const errMessageInvalidLength = 'An address must be exactly 40 characters, not including "0x"';
            const errMessageStartsWith0x = 'An address must begin with 0x';
            const errMessageInvalidInput = 'Entry contains invalid characters';

            const startsWith0xRegex = /(^0x)|(^$)/;
            const addressRegex = /(^0x[0-9a-fA-F]{40}$)|(^$)/;

            return [
                val => [0, 42].includes(val.length) || errMessageInvalidLength,
                val => startsWith0xRegex.test(val)  || errMessageStartsWith0x,
                val => addressRegex.test(val)       || errMessageInvalidInput,
            ];
        },
        shapedLabel() {
            return `${this.label} (address)`
        },
    },
    methods: {
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);

                const newParsed = parseAddressString(newValue);

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
