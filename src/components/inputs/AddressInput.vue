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
            const errMessageInvalidLength = this.$t('components.inputs.invalid_address_length');
            const errMessageStartsWith0x = this.$t('components.inputs.invalid_address_start');
            const errMessageInvalidInput = this.$t('components.inputs.invalid_address_characters');

            const startsWith0xRegex = /(^0x)|(^$)/;
            const addressRegex = /(^0x[0-9a-fA-F]{40}$)|(^$)/;

            return [
                val => [0, 42].includes(val.length) || errMessageInvalidLength,
                val => startsWith0xRegex.test(val)  || errMessageStartsWith0x,
                val => addressRegex.test(val)       || errMessageInvalidInput,
            ];
        },
        shapedLabel() {
            return this.$t('components.inputs.address_label', { label: this.label });
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
};
</script>

<template>
<BaseTextInput
    v-bind="$attrs"
    :model-value="modelValue"
    :label="shapedLabel"
    :name="name"
    :maxlength="42"
    :rules="rules"
    autocomplete="new-password"
    :placeholder="$t('components.inputs.address_placeholder')"
    @update:modelValue="handleChange"
/>
</template>

<style>

</style>
