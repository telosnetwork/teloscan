<template>
<div class="c-base-input">
    <q-input
        :model-value="modelValue"
        v-bind="quasarProps"
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
            type: [String, Number],
            required: true,
        },
    },
    computed: {
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
