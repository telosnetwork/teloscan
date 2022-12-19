<template>
<base-text-input
    ref="input"
    v-bind="$attrs"
    :model-value="modelValue"
    :label="shapedLabel"
    :name="name"
    :rules="rules"
    :size="undefined"
    @update:modelValue="handleChange"
>
    <template #append>
        <slot name="append" />
    </template>
</base-text-input>
</template>

<script>
import { parseUintString } from 'components/ContractTab/function-interface-utils';
import { BigNumber } from 'ethers';

import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'UnsignedIntInput',
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
        size: {
            type: [Number, String],
            required: true,
            validator: size => {
                return Number.isInteger(+size) &&
                       +size % 8 === 0 &&
                       +size <= 256 &&
                       +size >= 0;
            },
        },
    },
    data: () => ({
        previousParsedValue: undefined,
    }),
    computed: {
        rules() {
            const maximum = +this.size === 0 ? '0' : BigNumber.from(2).pow(+this.size).sub(1);

            const errMessageInvalidInput = 'Entry must be a valid unsigned integer';
            const errMessageTooLarge = `Maximum value for uint${this.size} is 2^${this.size} - 1`;
            const errMessageNoNegative = `Value for uint${this.size} must not be negative`;

            return [
                val => val[0] !== '-' || errMessageNoNegative,
                val => (/^\d*$/.test(val) || val === '') || errMessageInvalidInput,
                val => BigNumber.from(val || 0).lte(maximum) || errMessageTooLarge,
            ];
        },
        shapedLabel() {
            return `${this.label} (uint${this.size})`
        },
    },
    watch: {
        async size(newValue, oldValue) {
            if (newValue !== oldValue) {
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
                const newParsed = parseUintString(newValue, expectedSize);

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