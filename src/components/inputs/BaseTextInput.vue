<template>
<div class="c-base-input">
    <q-input
        :model-value="inputModel"
        v-bind="quasarProps"
        @change="inputModel = $event"
    />
</div>
</template>

<script>

import { quasarInputProps } from 'components/inputs/input-helpers';

export default {
    name: 'BaseTextInput',
    props: {
        ...quasarInputProps,
    },
    data: () => ({
        inputModel: '',
    }),

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
}
</script>

<style>
.c-base-input {

}
</style>
