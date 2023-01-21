<script>
import { BigNumber } from 'ethers';

import { integerSizeValidator, parseSignedIntString } from 'components/ContractTab/function-interface-utils';

import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'SignedIntInput',
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
        // e.g. a size of 64 produces a type === int64
        size: {
            type: [Number, String],
            required: true,
            validator: size => integerSizeValidator(size, true),
        },
    },
    computed: {
        rules() {
            const maximum = +this.size === 0 ? '0' : BigNumber.from(2).pow(+this.size).sub(1);
            const minimum = maximum.mul(-1);

            const errMessageInvalidInput = this.$t('components.inputs.invalid_signed_integer');
            const errMessageTooLargePow2 = this.$t('components.inputs.too_large_pow2', { size: this.size });
            const errMessageTooSmallPow2 = this.$t('components.inputs.too_small_pow2', { size: this.size });

            return [
                val => (/^-?\d+$/.test(val) || val === '')|| errMessageInvalidInput,
                val => BigNumber.from(val || 0).lte(maximum) || errMessageTooLargePow2,
                val => BigNumber.from(val || 0).gte(minimum) || errMessageTooSmallPow2,
            ];
        },
        shapedLabel() {
            return `${this.label} (int${this.size})`;
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
            }

            const expectedSize = +this.size === -1 ? undefined : +this.size;
            const newParsed = parseSignedIntString(newValue, expectedSize);

            if (this.previousParsedValue !== newParsed) {
                this.$emit('valueParsed', newParsed);
                this.previousParsedValue = newParsed;
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
    :rules="rules"
    :lazy-rules="false"
    :size="undefined"
    @update:modelValue="handleChange"
/>
</template>

<style>

</style>
