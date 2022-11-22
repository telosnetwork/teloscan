<template>
<div class="c-base-input">
    <q-input
        :model-value="modelValue"
        v-bind="binding"
        autocomplete="off"
        color="secondary"
        @update:modelValue="handleChange"
    />
</div>
</template>

<script>

import { quasarInputProps } from 'components/inputs/input-helpers';

export default {
    name: 'BaseTextInput',
    emits: [
        'update:modelValue',
    ],
    props: {
        ...quasarInputProps,
        modelValue: {
            type: String,
            required: true,
        },
    },
    computed: {
        mergedRules() {
            let requiredRule = [];

            if (['required', true, 'true'].includes(this.$attrs.required)) {
                requiredRule.push(val => val?.length !== 0 || 'This field is required')
            }

            return [
                ...(this.rules || []),
                ...requiredRule,
            ];
        },
        quasarProps() {
            const propNames = Object.keys(quasarInputProps);

            return propNames.reduce(
                (acc, name) => ({
                    [name]: this.$props[name],
                    ...acc,
                }),
                {},
            );
        },
        binding() {
            return {
                ...this.quasarProps,
                ...this.$attrs,

                required: undefined, // required case is handled in mergedRules; a defined value incorrectly causes the label to be always raised
                rules: this.mergedRules,
                label: `${this.label}${this.$attrs.required ? '*' : ''}`,
                disable: this.disable || ['disabled', true, 'true'].includes(this.$attrs.disabled),
                readonly: this.readonly || ['readonly', true, 'true'].includes(this.$attrs.readonly),
            };
        },
    },
    methods: {
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);
            }
        },
    },
}
</script>

<style>
.c-base-input {

}
</style>
