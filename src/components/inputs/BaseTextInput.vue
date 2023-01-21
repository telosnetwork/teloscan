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
        required: {
            type: [String, Boolean],
            default: undefined,
        },
        disabled: {
            type: [String, Boolean],
            default: undefined,
        },
        readonly: {
            type: [String, Boolean],
            default: undefined,
        },
    },
    computed: {
        mergedRules() {
            let requiredRule = [];

            if (['required', true, 'true'].includes(this.required)) {
                requiredRule.push(val => (val?.length ?? 0) > 0 || 'This field is required');
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
            // 'required' case is handled in mergedRules; due to a bug, any defined value for the required attribute
            // incorrectly causes the label to be always raised
            const required = undefined;
            const isRequired = ['required', true, 'true'].includes(this.required);
            const disable  = (this.disable  || ['disabled', true, 'true'].includes(this.disabled)) || undefined;
            const readonly = (this.readonly || ['readonly', true, 'true'].includes(this.readonly)) || undefined;

            const filteredAttrs = { ...this.$attrs };
            delete filteredAttrs.size; // size=undefined causes DOM warnings

            return {
                autocomplete: 'off',
                ...this.quasarProps,
                ...filteredAttrs,
                required,
                disable,
                readonly,
                rules: this.mergedRules,
                label: `${this.label}${isRequired ? '*' : ''}`,
            };
        },
    },
    watch: {
        async required(newValue, oldValue) {
            if (newValue !== oldValue) {
                // prevent 'field is required' error from persisting if 'required' prop changes
                await this.$refs.input.resetValidation();
            }
        },
    },
    methods: {
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);
            }
        },
        async validate() {
            this.$refs.input.validate();
        },
        async resetValidation() {
            await this.$refs.input.resetValidation();
        },
    },
};
</script>

<template>
<div class="c-base-input q-mx-sm">
    <q-input
        ref="input"
        :model-value="modelValue"
        :reactive-rules="true"
        v-bind="binding"
        color="secondary"
        @update:modelValue="handleChange"
    >
        <template #append>
            <slot name="append"></slot>
        </template>
    </q-input>
    <q-tooltip
        v-if="readonly"
        anchor="bottom middle"
        self="center right"
    >
        <span class="u-text--pre">{{  $t('components.inputs.readonly') }}</span>
    </q-tooltip>
</div>
</template>
