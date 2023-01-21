<script>
import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'StringInput',
    components: {
        BaseTextInput,
    },
    emits: [
        'update:modelValue',
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
        shapedLabel() {
            return `${this.label} (string)`;
        },
    },
    methods: {
        handleChange(newValue) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);
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
    @update:modelValue="handleChange"
/>
</template>

<style>

</style>
